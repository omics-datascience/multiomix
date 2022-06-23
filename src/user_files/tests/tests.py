from django.test import TestCase
from common.tests_utils import create_user_file
from user_files.models import UserFile
from user_files.models_choices import FileType, FileDecimalSeparator
import os
from django.contrib.auth.models import User

# Test user's password
USER_PASSWORD = 'test'


class ExperimentCommonsTestCase(TestCase):
    user: User

    # UserFiles
    with_dots: UserFile
    with_commas: UserFile
    non_numeric: UserFile

    @staticmethod
    def __get_file_path(filename: str) -> str:
        """
        Gets a File's path from a filename in the "test_files" directory
        @param filename: Filename to append
        @return: Absolute file's path
        """
        dir_name = os.path.dirname(__file__)
        return os.path.join(dir_name, f'tests_files/{filename}')

    def setUp(self):
        """Tests setup"""
        # Creates a test user
        self.user = User.objects.create_user(username='test_user', email='test@test.com', password=USER_PASSWORD)

        # UserFiles
        self.with_dots = create_user_file(
            self.__get_file_path('Data with dots.csv'),
            'Dots',
            FileType.MRNA,
            self.user
        )
        self.with_commas = create_user_file(
            self.__get_file_path('Data with commas.csv'),
            'Commas',
            FileType.MRNA,
            self.user
        )

        # TODO: implement
        self.non_numeric = create_user_file(
            self.__get_file_path('Non numeric.csv'),
            'Error',
            FileType.MRNA,
            self.user
        )

    def test_decimal_delimiter(self):
        """Test correct decimal separator inference"""
        self.assertEqual(self.with_dots.decimal_separator, FileDecimalSeparator.DOT)
        self.assertEqual(self.with_commas.decimal_separator, FileDecimalSeparator.COMMA)
