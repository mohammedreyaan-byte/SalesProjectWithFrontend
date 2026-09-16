from django.urls import path
from .views import *

urlpatterns = [
    path("", add_data),
    path("get-data", get_data),
    path("get-data/<int:id>", get_data_by_id),
    path("update", update_data_by_id),           # Added for bulk updates (api/update)
    path("update/<int:id>", update_data_by_id),  # Kept for single updates (api/update/1)
    path("delete/<int:id>", delete_data_by_id),
]