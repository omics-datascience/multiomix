import re
import numpy as np
from typing import List, Union, Optional

from django.http import QueryDict

from common.constants import TCGA_CONVENTION


def replace_cgds_suffix(list_of_ids: Union[List[str], np.ndarray]) -> List[str]:
    """
    Replaces TCGA suffix: '-01' (primary tumor), -06 (metastatic) and '-11' (normal) to avoid issues.
    NOTE: this function has to be here due to circular imports.
    @param list_of_ids: List of IDs to modify.
    @return: List with all the IDs without the suffix.
    """
    regex_strip = re.compile(TCGA_CONVENTION)
    return [re.sub(regex_strip, "", name) for name in list_of_ids]


def get_source_pk(post_request: QueryDict, key: str) -> Optional[int]:
    """
    Gets a PK as int from the POST QueryDict. None if it's invalid
    @param post_request: POST QueryDict
    @param key: Key in the POST QueryDict to retrieve
    @return: Int PK or None if it's invalid
    """
    content = post_request.get(key)
    if content is None or content == 'null':
        return None
    return int(content)
