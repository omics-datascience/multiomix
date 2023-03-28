from copy import deepcopy
from typing import List, Dict, Any, Iterator, Optional, Union
import pandas as pd
from pymongo import MongoClient
from pymongo.database import Database
import time
import random
import string
from django.conf import settings
import logging
from user_files.models_choices import FileType
from .exceptions import CouldNotDeleteInMongo
from .mrna_service import global_mrna_service

# Symbol used by cBioPortal to indicate the code of molecule (gene, miRNA, of Methylation CpG site ID)
MOLECULE_SYMBOL = 'Hugo_Symbol'

# Standard Symbol retrieve from Modulector/BioAPI
STANDARD_SYMBOL = 'Standard_Symbol'


class MongoService(object):
    """
    A MongoService for MongoDB Manipulation
    """
    client: MongoClient = None
    db: Database = None
    default_non_used_fields_pagination: Dict[str, int]  # Dict of usually not needed fields in pagination
    default_non_used_fields_experiments: Dict[str, int]  # Dict of usually not needed fields in experiments
    default_non_used_fields_query: Dict[str, int]  # Dict of usually not needed fields for anything else

    def __init__(self):
        # Instantiates the MongoDB Client
        self.client = self.__create_mongo_client()
        self.db = self.client[settings.MONGO_SETTINGS['db']]

        # Non used in pagination
        self.default_non_used_fields_pagination = {'Entrez_Gene_Id': 0}

        # Non used for experiments
        self.default_non_used_fields_experiments = {
            **self.default_non_used_fields_pagination,
            '_id': 0,
            MOLECULE_SYMBOL: 0  # Ignores molecule symbol to use the standardized one
        }

        # Non used fields when querying the DB to, for instance, check samples in common
        self.default_non_used_fields_query = {**self.default_non_used_fields_experiments, STANDARD_SYMBOL: 0}

    @staticmethod
    def __create_mongo_client() -> MongoClient:
        """
        Creates a MongoClient instance
        @return: MongoClient MongoClient
        """
        mongo_settings = settings.MONGO_SETTINGS
        uri = "mongodb://{}:{}@{}:{}/".format(
            mongo_settings['username'],
            mongo_settings['password'],
            mongo_settings['host'],
            mongo_settings['port']
        )

        return MongoClient(uri, serverSelectionTimeoutMS=mongo_settings['timeout'])

    @staticmethod
    def get_unique_key() -> str:
        """
        Generates a Unique Key for experiments
        @return: The generated unique key
        """
        timestamp = int(time.time())
        letters = string.ascii_lowercase
        hash_key = ''.join(random.choice(letters) for _ in range(5))
        return f'{timestamp}{hash_key}'

    @staticmethod
    def add_key(dictionary: Dict[str, str], unique_key: str) -> Dict[str, str]:
        """
        Adds key to the specified dict
        @param dictionary: Dictionary to modify
        @param unique_key: Unique Key to add to the dictionary
        @return: the modified dictionary
        """
        dictionary['experiment_key'] = unique_key
        return dictionary

    def get_collection_as_df(self, collection_name: str) -> pd.DataFrame:
        """
        Gets a MongoDB collection as a DataFrame
        @param collection_name: Collection's name
        @return: DataFrame with the collection data
        """
        df = pd.DataFrame(list(self.db[collection_name].find({}, self.default_non_used_fields_experiments)))

        try:
            df.set_index(STANDARD_SYMBOL, inplace=True)
        except Exception as e:
            logging.error(f'Error setting index {e}')

        return df

    @staticmethod
    def __process_batch(batch: List[Any]) -> pd.DataFrame:
        """
        Generate a Pandas DataFrame from a batch retrieved from MongoDB and removes unused fields.
        @param batch: Batch to process.
        @return: Pandas DataFrame with batch data.
        """
        df = pd.DataFrame(batch)
        df.drop('_id', axis=1, inplace=True)
        df.set_index(STANDARD_SYMBOL, inplace=True)
        return df

    def get_collection_as_df_in_chunks(self, collection_name: str, chunk_size: int) -> Iterator[pd.DataFrame]:
        """
        Gets a MongoDB collection as a DataFrame.
        NOTE: uses this kind of pagination as cursor is closed after 30 minutes by Mongo raising
        pymongo.errors.CursorNotFound exception, so we can't use built-in batch iterator with big experiments
        @param collection_name: Collection's name
        @param chunk_size: Chunk size in which the collection is retrieved
        @return: DataFrame with the collection data
        """
        last_id = None
        while True:
            # When it is first page doesn't apply filter
            filter_query = {'_id': {'$gt': last_id}} if last_id is not None else {}
            cursor = self.db[collection_name].find(
                filter_query,
                self.default_non_used_fields_pagination
            ).limit(chunk_size)

            # Get the data
            batch = list(cursor)

            if not batch:
                break

            # It's indexed by ID
            last_id = batch[-1]['_id']

            yield self.__process_batch(batch)

    def get_only_columns_names(self, collection_name: str, exclude_special_fields: bool = True) -> List[str]:
        """
        Gets a specific MongoDB collection's columns' names.
        @param collection_name: Collection to retrieve its columns' names.
        @param exclude_special_fields: If True excludes some special fields, set as False to exclude them.
        @return: List of columns' names.
        """
        # IMPORTANT: as the CGDS Datasets has all the documents with the same key we can
        # retrieve only one document to check its keys
        exclusion = self.default_non_used_fields_query if exclude_special_fields else None
        one_document = self.db[collection_name].find_one({}, exclusion)
        # Uses Unpacking Generalizations (https://www.python.org/dev/peps/pep-0448/)
        return [*one_document]

    def get_specific_row(self, collection_name: str, row: str) -> List[float]:
        """
        Gets a specific MongoDB collection's row.
        @param collection_name: Collection to retrieve the row.
        @param row: Row's identifier to retrieve.
        @return: List of rows values.
        """
        # Exclude '_id' field getting the second column
        column_names = self.get_only_columns_names(collection_name, exclude_special_fields=False)
        row_identifier = column_names[1]
        document: Optional[Dict] = self.db[collection_name].find_one(
            {row_identifier: row},
            self.default_non_used_fields_query
        )
        return list(document.values())

    def get_collection_row_count(self, collection_name: str) -> int:
        """
        Gets a specific MongoDB collection row count
        @param collection_name: Collection to retrieve its number of rows
        @return: Number of rows
        """
        return self.db[collection_name].count_documents({})

    @staticmethod
    def __get_standard_ids(file_type: FileType, molecules: List[str]) -> Optional[Dict]:
        """
        Gets standard IDs for a list of molecules from Modulector/BioAPI APIs.
        @param file_type: File type to check if it is a request for Modulector (miRNA, Methylation), or BioAPI (genes).
        @param molecules: List of molecules to send.
        @return:
        """
        is_for_bioapi = file_type in [FileType.MRNA, FileType.CNA]
        if is_for_bioapi:
            logging.warning('Retrieving data from BioAPI')
        else:
            logging.warning('Retrieving data from Modulector')

        if is_for_bioapi:
            data = global_mrna_service.get_bioapi_service_content(
                'gene-symbols',
                request_params={'gene_ids': molecules},
                is_paginated=False,
                method='post'
            )
        elif file_type == FileType.MIRNA:
            data = global_mrna_service.get_modulector_service_content(
                'mirna-codes',
                request_params={'mirna_codes': molecules},
                is_paginated=False,
                method='post'
            )
        else:
            # In case of methylation
            data = global_mrna_service.get_modulector_service_content(
                'methylation-sites',
                request_params={'methylation_sites': molecules},
                is_paginated=False,
                method='post'
            )

        return data

    def insert_cgds_dataset(self, dataset_df: pd.DataFrame, table_name: str, file_type: FileType) -> bool:
        """
        Inserts a CGDS dataset Pandas DataFrame in MongoDB
        @param dataset_df: DataFrame to Insert
        @param table_name: Name of the MongoDB's collection where the DataFrame will be inserted
        @param file_type: File type to check which service needs to invoke.
        @return: True if everything gone well, False otherwise
        """
        # Gets experiment MongoDB Collection
        cgds_table = self.db[table_name]

        # Cast to Dict, then list, and the adds the UEK
        data_dict = dataset_df.to_dict("records")
        data_list = list(data_dict)

        # In case of clinical data there is not molecules nor aliases
        if file_type != FileType.CLINICAL:
            # Gets standard IDs from Modulector/BioAPI
            molecules = [elem[MOLECULE_SYMBOL] for elem in data_list]
            molecules_std_ids = self.__get_standard_ids(file_type, molecules)
            if molecules_std_ids is None:
                logging.error(f'Could not retrieve Modulector/BioAPI data. Molecules of type ({file_type}):')
                logging.error(molecules)
                return False

            # Appends the standard key to the data to be inserted
            ambiguous_symbols: List[Dict[str, Any]] = []
            for elem in data_list:
                symbol = elem[MOLECULE_SYMBOL]
                standard_symbols: Union[str, List[str]] = molecules_std_ids[symbol]
                standard_symbol: str
                if standard_symbols:
                    if file_type in [FileType.MRNA, FileType.CNA, FileType.METHYLATION]:
                        len_results = len(standard_symbols)
                        # In case of empty symbol, just uses the original one
                        if len_results == 0:
                            standard_symbol = symbol
                        elif len_results == 1:
                            # Uses the only returned standard symbol
                            standard_symbol = standard_symbols[0]
                        else:
                            # In case of ambiguity, copies the element for all the aliases
                            standard_symbol = symbol  # To prevent later addition

                            # Clones the element and adds standard symbol
                            for aux_symbol in standard_symbols:
                                # Omits the original symbol
                                if aux_symbol != symbol:
                                    new_elem = deepcopy(elem)
                                    new_elem[STANDARD_SYMBOL] = aux_symbol
                                    ambiguous_symbols.append(new_elem)
                    else:
                        # In case of miRNA, can be only one alias
                        standard_symbol = standard_symbols if standard_symbols else symbol
                else:
                    # In case of empty symbol, just uses the original one
                    standard_symbol = symbol

                if standard_symbol is not None:
                    elem[STANDARD_SYMBOL] = standard_symbol

            # Concatenates ambiguous elements
            data_list.extend(ambiguous_symbols)

        # Inserts in DB
        result = cgds_table.insert_many(data_list)

        # Returns the True if everything gone well
        return len(result.inserted_ids) == len(data_list)

    def drop_collection(self, collection_to_remove: str):
        """
        Removes a collection from the db
        @param collection_to_remove: Collection's name
        @raise CouldNotDeleteInMongo if the collection still exists in MongoDB to prevent commit DB transaction
        """
        self.db[collection_to_remove].drop()
        if collection_to_remove in self.db.list_collection_names():
            raise CouldNotDeleteInMongo('The collection still exists in the DB')

    def close_mongo_db_connection(self):
        """
        Closes the current connection. When the client instance is used again it'll be re-opened
        """
        self.client.close()


global_mongo_service = MongoService()
