from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

class Command(BaseCommand):
    help = 'Populate groups with STRICT permissions based on user request'

    def handle(self, *args, **options):
        # 👤 Patient Permissions (Basic User)
        patient_perms = [
            'view_appointment', 
            'add_appointment', 
            'view_medicalrecord', 
            'add_review', 
            'view_review',
            'view_notification'
        ]

        # 👨‍⚕️ Doctor Permissions (Core User)
        doctor_perms = [
            'view_appointment', 
            'change_appointment',
            'view_medicalrecord', 
            'add_medicalrecord', 
            'change_medicalrecord',
            'add_patientdiagnosis', 
            'change_patientdiagnosis',
            'add_patientprescription', 
            'change_patientprescription',
            'add_doctorschedule', 
            'change_doctorschedule',
            'view_doctorschedule',
            'view_notification'
        ]

        doctor_group, _ = Group.objects.get_or_create(name='Doctor')
        patient_group, _ = Group.objects.get_or_create(name='Patient')

        # Clear existing permissions to be strict
        doctor_group.permissions.clear()
        patient_group.permissions.clear()

        # Apply Patient Perms
        for codename in patient_perms:
            perm = Permission.objects.filter(codename=codename).first()
            if perm:
                patient_group.permissions.add(perm)
        
        # Apply Doctor Perms
        for codename in doctor_perms:
            perm = Permission.objects.filter(codename=codename).first()
            if not perm and codename == 'view_patient':
                 # Fallback to authentication.view_patient if it exists
                 perm = Permission.objects.filter(codename='view_patient', content_type__app_label='authentication').first()
            
            if perm:
                doctor_group.permissions.add(perm)
        
        self.stdout.write(self.style.SUCCESS('Successfully applied STRICT permissions to Doctor and Patient groups'))
