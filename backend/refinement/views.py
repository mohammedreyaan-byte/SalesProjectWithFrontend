import io
import os
import pandas as pd
import csv
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import DatabaseError
from django.core.exceptions import ObjectDoesNotExist
from .serializer.productserializer import ProductSerializer
from pipeline.clean_data import clean_csv
from .models import Refinement
from .s3_service import upload_csv_to_s3


def sync_db_to_s3():
    # 1. Fetch updated data from DB
    updated_data = Refinement.objects.all()
    updated_data_list = list(updated_data.values("id", "product", "price", "rating", "created_at", "updated_at"))
    df = pd.DataFrame(updated_data_list)

    # 2. Save local CSV & run cleaning pipeline
    os.makedirs("data", exist_ok=True)
    df.to_csv("data/data.csv", index=False)
    clean_csv()

    # 3. WRITE DATAFRAME INTO THE MEMORY BUFFER
    csv_buffer_file = io.StringIO()
    df.to_csv(csv_buffer_file, index=False)

    # 4. Upload populated buffer to S3
    upload_csv_to_s3(csv_buffer_file)


# Insert Data into DB & CSV (Supports Single Record or List of Records)
@api_view(['POST'])
def add_data(request):
    try:
        data = request.data
        is_many = isinstance(data, list)

        # 1. PRICE & RATING VALIDATION (MUST BE PRESENT AND > 0)
        if is_many:
            for idx, item in enumerate(data):
                price = item.get('price')
                rating = item.get('rating')

                if price is None or price == "":
                    return Response({
                        "status": "fail",
                        "message": f"Item at index {idx} is missing a required 'price' field."
                    }, status=status.HTTP_400_BAD_REQUEST)
                try:
                    if float(price) <= 0:
                        return Response({
                            "status": "fail",
                            "message": f"Item at index {idx}: 'price' must be greater than zero."
                        }, status=status.HTTP_400_BAD_REQUEST)
                except ValueError:
                    return Response({
                        "status": "fail",
                        "message": f"Item at index {idx}: 'price' must be a valid number."
                    }, status=status.HTTP_400_BAD_REQUEST)

                if rating is None or rating == "":
                    return Response({
                        "status": "fail",
                        "message": f"Item at index {idx} is missing a required 'rating' field."
                    }, status=status.HTTP_400_BAD_REQUEST)
                try:
                    if float(rating) <= 0:
                        return Response({
                            "status": "fail",
                            "message": f"Item at index {idx}: 'rating' must be greater than zero."
                        }, status=status.HTTP_400_BAD_REQUEST)
                except ValueError:
                    return Response({
                        "status": "fail",
                        "message": f"Item at index {idx}: 'rating' must be a valid number."
                    }, status=status.HTTP_400_BAD_REQUEST)

            # DUPLICATE CHECK FOR LIST
            product_names = [item.get('product') for item in data if item.get('product')]
            if len(product_names) != len(set(product_names)):
                return Response({
                    "status": "fail",
                    "message": "Duplicate product names found inside the request list."
                }, status=status.HTTP_400_BAD_REQUEST)

            existing = Refinement.objects.filter(product__iexact__in=product_names)
            if existing.exists():
                existing_names = list(existing.values_list('product', flat=True))
                return Response({
                    "status": "fail",
                    "message": f"Product(s) already exist in database: {', '.join(existing_names)}"
                }, status=status.HTTP_400_BAD_REQUEST)

        else:
            # SINGLE ITEM PRICE & RATING CHECK
            price = data.get('price')
            rating = data.get('rating')

            if price is None or price == "":
                return Response({
                    "status": "fail",
                    "message": "Field 'price' is required."
                }, status=status.HTTP_400_BAD_REQUEST)
            try:
                if float(price) <= 0:
                    return Response({
                        "status": "fail",
                        "message": "'price' must be greater than zero."
                    }, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({
                    "status": "fail",
                    "message": "'price' must be a valid number."
                }, status=status.HTTP_400_BAD_REQUEST)

            if rating is None or rating == "":
                return Response({
                    "status": "fail",
                    "message": "Field 'rating' is required."
                }, status=status.HTTP_400_BAD_REQUEST)
            try:
                if float(rating) <= 0:
                    return Response({
                        "status": "fail",
                        "message": "'rating' must be greater than zero."
                    }, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({
                    "status": "fail",
                    "message": "'rating' must be a valid number."
                }, status=status.HTTP_400_BAD_REQUEST)

            # DUPLICATE CHECK FOR SINGLE ITEM
            product_name = data.get('product')
            if product_name and Refinement.objects.filter(product__iexact=product_name).exists():
                return Response({
                    "status": "fail",
                    "message": f"Product '{product_name}' already exists in catalog."
                }, status=status.HTTP_400_BAD_REQUEST)

        # Save to database if validation passes
        serializer = ProductSerializer(data=data, many=is_many)
        if serializer.is_valid():
            serializer.save()
        else:
            return Response({
                "status": "fail",
                "message": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        # Sync Database to CSV & S3
        sync_db_to_s3()

        return Response({
            "status": "success",
            "message": "Data added successfully"
        }, status=status.HTTP_201_CREATED)

    except DatabaseError as e:
        return Response({
            "status": "fail",
            "message": f"Database error: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except (IOError, OSError) as e:
        return Response({
            "status": "fail",
            "message": f"File writing error: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({
            "status": "fail",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Get data from Database
@api_view(['GET'])
def get_data(request):
    try:
        sale_data = Refinement.objects.all()
        serializer = ProductSerializer(sale_data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except DatabaseError as e:
        return Response({
            "status": "fail",
            "message": f"Database error: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({
            "status": "fail",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_data_by_id(request, id):
    try:
        sale_data = Refinement.objects.get(id=int(id))
        serializer = ProductSerializer(sale_data)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except ValueError:
        return Response({
            "status": "fail",
            "message": "Invalid ID format. ID must be an integer."
        }, status=status.HTTP_400_BAD_REQUEST)
    except ObjectDoesNotExist:
        return Response({
            "status": "fail",
            "message": f"Record with ID {id} does not exist."
        }, status=status.HTTP_404_NOT_FOUND)
    except DatabaseError as e:
        return Response({
            "status": "fail",
            "message": f"Database error: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({
            "status": "fail",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Delete the existing data by id
@api_view(['DELETE'])
def delete_data_by_id(request, id):
    try:
        numeric_id = int(id)

        item = Refinement.objects.get(id=numeric_id)
        item.delete()

        sync_db_to_s3()

        return Response({
            "status": "success",
            "message": "Data deleted successfully"
        }, status=status.HTTP_200_OK)

    except ValueError:
        return Response({
            "status": "fail",
            "message": "Invalid ID format. ID must be an integer."
        }, status=status.HTTP_400_BAD_REQUEST)
    except ObjectDoesNotExist:
        return Response({
            "status": "fail",
            "message": f"Record with ID {id} does not exist."
        }, status=status.HTTP_404_NOT_FOUND)
    except DatabaseError as e:
        return Response({
            "status": "fail",
            "message": f"Database error: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except (IOError, OSError) as e:
        return Response({
            "status": "fail",
            "message": f"File writing error: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({
            "status": "fail",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Update Data (Supports Single Record or List of Records)
@api_view(['PUT'])
def update_data_by_id(request, id=None):
    try:
        data = request.data

        # Batch update logic if payload is a list
        if isinstance(data, list):
            for item_data in data:
                item_id = item_data.get('id')
                if not item_id:
                    return Response({
                        "status": "fail",
                        "message": "Each item in the list must contain an 'id' field for updating."
                    }, status=status.HTTP_400_BAD_REQUEST)

                # VALIDATE PRICE AND RATING IF PRESENT IN UPDATE
                if 'price' in item_data:
                    price_val = item_data['price']
                    if price_val is None or price_val == "":
                        return Response({"status": "fail", "message": f"'price' cannot be null or empty for ID {item_id}."}, status=status.HTTP_400_BAD_REQUEST)
                    try:
                        if float(price_val) <= 0:
                            return Response({"status": "fail", "message": f"'price' must be greater than zero for ID {item_id}."}, status=status.HTTP_400_BAD_REQUEST)
                    except ValueError:
                        return Response({"status": "fail", "message": f"'price' must be a valid number for ID {item_id}."}, status=status.HTTP_400_BAD_REQUEST)

                if 'rating' in item_data:
                    rating_val = item_data['rating']
                    if rating_val is None or rating_val == "":
                        return Response({"status": "fail", "message": f"'rating' cannot be null or empty for ID {item_id}."}, status=status.HTTP_400_BAD_REQUEST)
                    try:
                        if float(rating_val) <= 0:
                            return Response({"status": "fail", "message": f"'rating' must be greater than zero for ID {item_id}."}, status=status.HTTP_400_BAD_REQUEST)
                    except ValueError:
                        return Response({"status": "fail", "message": f"'rating' must be a valid number for ID {item_id}."}, status=status.HTTP_400_BAD_REQUEST)

                try:
                    record = Refinement.objects.get(id=int(item_id))
                except ObjectDoesNotExist:
                    return Response({
                        "status": "fail",
                        "message": f"Record with ID {item_id} does not exist."
                    }, status=status.HTTP_404_NOT_FOUND)

                # DUPLICATE CHECK FOR BATCH UPDATE
                new_product_name = item_data.get('product')
                if new_product_name:
                    duplicate = Refinement.objects.filter(product__iexact=new_product_name).exclude(id=int(item_id)).exists()
                    if duplicate:
                        return Response({
                            "status": "fail",
                            "message": f"Cannot rename ID {item_id} to '{new_product_name}'. Product name already exists."
                        }, status=status.HTTP_400_BAD_REQUEST)

                serializer = ProductSerializer(record, data=item_data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                else:
                    return Response({
                        "status": "fail",
                        "message": serializer.errors
                    }, status=status.HTTP_400_BAD_REQUEST)

        # Single record update logic
        else:
            if id is None:
                return Response({
                    "status": "fail",
                    "message": "ID parameter is required for single record update."
                }, status=status.HTTP_400_BAD_REQUEST)

            # VALIDATE PRICE AND RATING IF PRESENT IN UPDATE
            if 'price' in data:
                price_val = data['price']
                if price_val is None or price_val == "":
                    return Response({"status": "fail", "message": "'price' cannot be null or empty."}, status=status.HTTP_400_BAD_REQUEST)
                try:
                    if float(price_val) <= 0:
                        return Response({"status": "fail", "message": "'price' must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)
                except ValueError:
                    return Response({"status": "fail", "message": "'price' must be a valid number."}, status=status.HTTP_400_BAD_REQUEST)

            if 'rating' in data:
                rating_val = data['rating']
                if rating_val is None or rating_val == "":
                    return Response({"status": "fail", "message": "'rating' cannot be null or empty."}, status=status.HTTP_400_BAD_REQUEST)
                try:
                    if float(rating_val) <= 0:
                        return Response({"status": "fail", "message": "'rating' must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)
                except ValueError:
                    return Response({"status": "fail", "message": "'rating' must be a valid number."}, status=status.HTTP_400_BAD_REQUEST)

            numeric_id = int(id)
            sale_data = Refinement.objects.get(id=numeric_id)

            # DUPLICATE CHECK FOR SINGLE UPDATE
            new_product_name = data.get('product')
            if new_product_name:
                duplicate = Refinement.objects.filter(product__iexact=new_product_name).exclude(id=numeric_id).exists()
                if duplicate:
                    return Response({
                        "status": "fail",
                        "message": f"Cannot rename to '{new_product_name}'. Product name already exists."
                    }, status=status.HTTP_400_BAD_REQUEST)

            serializer = ProductSerializer(sale_data, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
            else:
                return Response({
                    "status": "fail",
                    "message": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

        # Sync Database to CSV & S3
        sync_db_to_s3()

        return Response({
            "status": "success",
            "message": "Data updated successfully"
        }, status=status.HTTP_200_OK)

    except ValueError:
        return Response({
            "status": "fail",
            "message": "Invalid ID format. ID must be an integer."
        }, status=status.HTTP_400_BAD_REQUEST)
    except ObjectDoesNotExist:
        return Response({
            "status": "fail",
            "message": f"Record with ID {id} does not exist."
        }, status=status.HTTP_404_NOT_FOUND)
    except DatabaseError as e:
        return Response({
            "status": "fail",
            "message": f"Database error: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except (IOError, OSError) as e:
        return Response({
            "status": "fail",
            "message": f"File writing error: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({
            "status": "fail",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)