# s3_service.py
import os
import boto3

def upload_csv_to_s3(csv_buffer):
    try:
        bucket_name = os.getenv("AWS_S3_BUCKET_NAME", "").strip()
        if not bucket_name:
            print("[S3 WARNING] No bucket name configured. Skipping S3 upload.")
            return

        s3_client = boto3.client(
            "s3",
            region_name=os.getenv("AWS_REGION", "ap-south-2").strip(),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "").strip(),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "").strip(),
        )

        s3_client.put_object(
            Bucket=bucket_name,
            Key="data/data.csv",
            Body=csv_buffer.getvalue(),
            ContentType="text/csv",
        )
        print("[S3 SUCCESS] Updated data/data.csv in AWS S3")
    except Exception as e:
        # LOG THE ERROR BUT DO NOT CRASH THE DJANGO REQUEST
        print(f"[S3 ERROR] Could not sync to S3: {e}")