# backend/config/urls.py

from django.contrib import admin
from django.urls import path, include # Make sure 'include' is imported

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # This line tells Django that any URL starting with 'api/'
    # should be handled by the urls.py file inside our 'core' app.
    path('api/', include('core.urls')), 
]