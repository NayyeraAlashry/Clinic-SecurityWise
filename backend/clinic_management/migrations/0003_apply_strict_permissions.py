from django.db import migrations

def apply_strict_permissions(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Permission = apps.get_model('auth', 'Permission')
    ContentType = apps.get_model('contenttypes', 'ContentType')

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

    # Clear existing permissions
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
             perm = Permission.objects.filter(codename='view_patient', content_type__app_label='authentication').first()
        
        if perm:
            doctor_group.permissions.add(perm)

def rollback_permissions(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('clinic_management', '0002_ensure_medical_records'),
        ('auth', '0012_alter_user_first_name_max_length'), # Ensure auth is loaded
    ]

    operations = [
        migrations.RunPython(apply_strict_permissions, rollback_permissions),
    ]
