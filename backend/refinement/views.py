import os
import pandas as pd
import csv
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import DatabaseError
from django.core.exceptions import ObjectDoesNotExist
from .serializer.productserializer import ProductSerializer
from pipeline.csv_handler import add_to_csv
from pipeline.clean_data import clean_csv
from .models import Refinement


# Insert Data into DB & CSV (Supports Single Record or List of Records)
@api_view(['POST'])
def add_data(request):
    try:
        data = request.data
        # Check if the incoming payload is a list
        is_many = isinstance(data, list)

        serializer = ProductSerializer(data=data, many=is_many)
        if serializer.is_valid():
            serializer.save()
        else:
            return Response({
                "status": "fail",
                "message": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        # Sync Database to CSV
        updated_data = Refinement.objects.all()
        data_list = list(updated_data.values("id", "product", "price", "rating", "created_at", "updated_at"))
        df = pd.DataFrame(data_list)

        os.makedirs("data", exist_ok=True)
        df.to_csv("data/data.csv", index=False)
        clean_csv()

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

        sale_data = Refinement.objects.all()
        data = list(sale_data.values("id", "product", "price", "rating", "created_at", "updated_at"))
        df = pd.DataFrame(data)

        os.makedirs("data", exist_ok=True)
        df.to_csv("data/data.csv", index=False)
        clean_csv()

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

                try:
                    record = Refinement.objects.get(id=int(item_id))
                except ObjectDoesNotExist:
                    return Response({
                        "status": "fail",
                        "message": f"Record with ID {item_id} does not exist."
                    }, status=status.HTTP_404_NOT_FOUND)

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

            numeric_id = int(id)
            sale_data = Refinement.objects.get(id=numeric_id)
            serializer = ProductSerializer(sale_data, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
            else:
                return Response({
                    "status": "fail",
                    "message": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

        # Sync Database to CSV
        updated_data = Refinement.objects.all()
        data_list = list(updated_data.values("id", "product", "price", "rating", "created_at", "updated_at"))
        df = pd.DataFrame(data_list)

        os.makedirs("data", exist_ok=True)
        df.to_csv("data/data.csv", index=False)
        clean_csv()

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
