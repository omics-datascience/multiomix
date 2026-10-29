import os

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from common.tests_utils import create_user_file
from institutions.models import Institution, InstitutionAdministration
from user_files.models_choices import FileType


class UserFileOwnerPermissionsTest(TestCase):
    """Ensure institutional visibility does not grant dataset mutation rights."""

    def setUp(self):
        """Create an owner, an institution administrator, and a member."""
        self.owner = User.objects.create_user(username='dataset_owner')
        self.institution_admin = User.objects.create_user(username='institution_admin')
        self.institution_member = User.objects.create_user(username='institution_member')

        self.institution = Institution.objects.create(name='Shared institution')
        InstitutionAdministration.objects.create(
            institution=self.institution,
            user=self.owner,
        )
        InstitutionAdministration.objects.create(
            institution=self.institution,
            user=self.institution_admin,
            is_institution_admin=True,
        )
        InstitutionAdministration.objects.create(
            institution=self.institution,
            user=self.institution_member,
        )

        file_path = os.path.join(os.path.dirname(__file__), 'tests_files', 'Data with dots.csv')
        self.user_file = create_user_file(file_path, 'Shared dataset', FileType.MRNA, self.owner)
        self.user_file.institutions.add(self.institution)
        self.client = APIClient()

    def test_institution_admin_can_read_but_cannot_update_or_delete(self):
        """Institution administrators retain read access but cannot mutate a dataset."""
        self.client.force_authenticate(user=self.institution_admin)

        read_response = self.client.get(f'/user-files/{self.user_file.pk}/')
        self.assertEqual(read_response.status_code, 200)
        self.assertFalse(read_response.data['is_owner'])
        self.assertFalse(read_response.data['is_private_or_institution_admin'])

        update_response = self.client.patch(
            f'/user-files/{self.user_file.pk}/',
            data={
                'name': 'Changed by administrator',
                'file_type': FileType.MRNA.value,
                'is_cpg_site_id': False,
            },
            format='json',
        )
        delete_response = self.client.delete(f'/user-files/{self.user_file.pk}/')
        toggle_response = self.client.post(
            '/user-files/switch-file-public-view/',
            data={'userFileId': self.user_file.pk},
            format='json',
        )

        self.assertEqual(update_response.status_code, 404)
        self.assertEqual(delete_response.status_code, 404)
        self.assertEqual(toggle_response.status_code, 403)
        self.user_file.refresh_from_db()
        self.assertEqual(self.user_file.name, 'Shared dataset')

    def test_institution_member_cannot_mutate_or_manage_sharing(self):
        """Ordinary institution members cannot mutate or manage sharing either."""
        self.client.force_authenticate(user=self.institution_member)

        update_response = self.client.patch(
            f'/user-files/{self.user_file.pk}/',
            data={
                'name': 'Changed by member',
                'file_type': FileType.MRNA.value,
                'is_cpg_site_id': False,
            },
            format='json',
        )
        remove_institution_response = self.client.post(
            '/user-files/remove-institution',
            data={
                'userFileId': self.user_file.pk,
                'institutionId': self.institution.pk,
            },
            format='json',
        )
        toggle_response = self.client.post(
            '/user-files/switch-file-public-view/',
            data={'userFileId': self.user_file.pk},
            format='json',
        )

        self.assertEqual(update_response.status_code, 404)
        self.assertEqual(remove_institution_response.status_code, 403)
        self.assertEqual(toggle_response.status_code, 403)

    def test_only_owner_can_update_delete_and_manage_sharing(self):
        """The owner can perform the complete dataset management workflow."""
        extra_institution = Institution.objects.create(name='Owner institution')
        InstitutionAdministration.objects.create(
            institution=extra_institution,
            user=self.owner,
        )
        self.client.force_authenticate(user=self.owner)

        update_response = self.client.patch(
            f'/user-files/{self.user_file.pk}/',
            data={
                'name': 'Updated dataset',
                'file_type': FileType.MRNA.value,
                'is_cpg_site_id': False,
            },
            format='json',
        )
        share_response = self.client.post(
            '/user-files/share-to-institution',
            data={
                'userFileId': self.user_file.pk,
                'institutionId': extra_institution.pk,
            },
            format='json',
        )

        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(share_response.status_code, 200)
        self.assertTrue(self.user_file.institutions.filter(pk=extra_institution.pk).exists())

        remove_response = self.client.post(
            '/user-files/remove-institution',
            data={
                'userFileId': self.user_file.pk,
                'institutionId': extra_institution.pk,
            },
            format='json',
        )
        toggle_response = self.client.post(
            '/user-files/switch-file-public-view/',
            data={'userFileId': self.user_file.pk},
            format='json',
        )

        self.assertEqual(remove_response.status_code, 200)
        self.assertEqual(toggle_response.status_code, 200)

        delete_response = self.client.delete(f'/user-files/{self.user_file.pk}/')
        self.assertEqual(delete_response.status_code, 204)
