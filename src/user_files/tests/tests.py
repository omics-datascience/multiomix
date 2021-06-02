from django.test import TestCase, Client
from common.enums import ResponseCode
from common.tests_utils import create_user_file
from user_files.enums import UserFileUploadErrorCode
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

    def __check_non_numerical_datasets_multiomics(self, client: Client, file_to_upload: str, must_be_successful: bool):
        """
        Test correct response in Datasets/Multiomix when uploads a (non) numeric dataset
        @param client: Client instance to made the request
        @param file_to_upload: File's path to upload
        @param must_be_successful: Expected boolean flag indicating success or error in response
        """
        response = client.post(
            '/user-files/',
            {
                'name': 'Non numerical data',
                'description': 'CSV with some non numerical fields',
                'file_type': "1",  # String as form-data in frontends sends the data as string. "1" -> mRNA
                'file_obj': open(file_to_upload)
            }
        )

        # Custom response
        if must_be_successful:
            # 200 Ok or 201 Created
            self.assertIn(response.status_code, [200, 201])
        else:
            # 400 Bad Request
            self.assertEqual(response.status_code, 400)
            json_response = response.json()
            self.assertIn('file_obj', json_response)
            status_response = json_response['file_obj']['status']
            code = int(status_response['code'])
            internal_code = int(status_response['internal_code'])

            self.assertEqual(code, ResponseCode.ERROR.value)
            self.assertEqual(internal_code, UserFileUploadErrorCode.INVALID_FORMAT_NON_NUMERIC.value)

    def __check_in_new_experiment(self, client: Client, file_to_upload: str, must_be_successful: bool):
        """
        Test correct response in New Experiment when uploads a (non) numeric dataset
        @param client: Client instance to made the request
        @param file_to_upload: File's path to upload
        @param must_be_successful: Expected boolean flag indicating success or error in response
        """
        response = client.post(
            '/api-service/',
            {
                'name': 'Non numerical data',
                'description': 'CSV with some non numerical fields',
                'fileType': 1,  # 1 -> mRNA
                'coefficientThreshold': 0.7,
                'standardDeviationGene': 0.0,
                'standardDeviationGEM': 0.2,
                'correlationMethod': 3,  # 3 -> Pearson
                'adjustmentMethod': 1,  # 1 -> Benjamini-Hochberg
                'mRNAType': 3,  # 3 -> New Dataset
                'mRNAExistingFilePk': 'null',
                'mRNACGDSStudyPk': 'null',
                'mRNAFile': open(file_to_upload),
                'gemType': 3,
                'gemExistingFilePk': 'null',
                'gemCGDSStudyPk': 'null',
                'gemFile': open(file_to_upload)
            }
        )

        # 200 as it's not a custom response and not a Django Rest Framework one
        self.assertEqual(response.status_code, 200)

        # Custom response
        json_response = response.json()
        self.assertIn('status', json_response)
        status_response = json_response['status']
        code = int(status_response['code'])
        internal_code = status_response['internal_code']

        if must_be_successful:
            self.assertEqual(code, ResponseCode.SUCCESS.value)
            self.assertIsNone(internal_code)
        else:
            self.assertEqual(code, ResponseCode.ERROR.value)
            self.assertEqual(int(internal_code), UserFileUploadErrorCode.INVALID_FORMAT_NON_NUMERIC.value)

    def test_non_numerical_on_upload(self):
        """Test that users' datasets has only numerical data"""
        # Login
        client = Client()
        client.login(username=self.user.username, password=USER_PASSWORD)

        # Datasets/Multiomix
        non_numeric_file_to_upload = self.__get_file_path('Non numeric.csv')
        self.__check_non_numerical_datasets_multiomics(client, non_numeric_file_to_upload, must_be_successful=False)

        # New experiment action
        self.__check_in_new_experiment(client, non_numeric_file_to_upload, must_be_successful=False)

        # Good file
        correct_file = self.__get_file_path('Data with commas.csv')

        # Datasets/Multiomix
        self.__check_non_numerical_datasets_multiomics(client, correct_file, must_be_successful=True)

        # New experiment action
        self.__check_in_new_experiment(client, correct_file, must_be_successful=True)
