from rest_framework.permissions import BasePermission


def _in_group(user, group_name):
    return user.is_authenticated and user.groups.filter(name=group_name).exists()


def is_admin_user(user):
    return user.is_authenticated and (
        user.is_superuser or _in_group(user, "MasterUser")
    )


def is_doctor_user(user):
    return user.is_authenticated and (
        user.has_perm("clinic_management.view_doctorschedule") or _in_group(user, "Doctor")
    )


def is_patient_user(user):
    return user.is_authenticated and (
        user.has_perm("clinic_management.add_appointment") or _in_group(user, "Patient")
    )


class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return is_admin_user(request.user)


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return True
        return is_admin_user(request.user)


class IsDoctorUser(BasePermission):
    def has_permission(self, request, view):
        return is_doctor_user(request.user)


class IsPatientUser(BasePermission):
    def has_permission(self, request, view):
        return is_patient_user(request.user)
