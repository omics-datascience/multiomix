import subprocess
import sys
from pathlib import Path

from django.conf import settings
from django.test import SimpleTestCase


class DifferentialExpressionTaskImportTestCase(SimpleTestCase):
    def test_importing_tasks_does_not_initialize_rpy2(self):
        script = """
import os
import sys

os.environ.setdefault(
    'DJANGO_SETTINGS_MODULE',
    'multiomics_intermediate.settings',
)

import django

django.setup()
import differential_expression.tasks

if any(name == 'rpy2' or name.startswith('rpy2.') for name in sys.modules):
    raise RuntimeError('Importing differential_expression.tasks initialized rpy2')
"""

        result = subprocess.run(
            [sys.executable, '-c', script],
            cwd=Path(settings.BASE_DIR),
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )

        self.assertEqual(
            result.returncode,
            0,
            msg=f'stdout:\n{result.stdout}\nstderr:\n{result.stderr}',
        )
