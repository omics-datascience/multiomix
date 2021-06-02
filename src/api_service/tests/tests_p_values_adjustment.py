from typing import List
from django.test import TestCase
from api_service.adjustment import BenjaminiHochberg, BenjaminiYekutieli, Bonferroni
from statsmodels.stats.multitest import fdrcorrection, multipletests
from math import ceil


class AdjustmentTestCase(TestCase):
    p_values: List[float]

    def setUp(self):
        self.p_values = [2.354054e-07, 2.10159e-05, 2.576842e-05, 9.814783e-05, 0.000105261, 0.0001241481, 0.0001325988,
                         0.0001568503, 0.0002254557, 0.000379538, 0.0006114943, 0.001613954, 0.00330243, 0.003538342,
                         0.005236997, 0.006831909, 0.007059226, 0.008805129, 0.00940104, 0.01129798, 0.02115017,
                         0.04922736, 0.06053298, 0.06262239, 0.07395153, 0.08281103, 0.08633331, 0.1190654, 0.1890796,
                         0.2058494, 0.2209214, 0.2856, 0.3048895, 0.4660682, 0.4830809, 0.4921755, 0.5319453, 0.575155,
                         0.5783195, 0.6185894, 0.636362, 0.6448587, 0.6558414, 0.6885884, 0.7189864, 0.8179539,
                         0.8274487, 0.89713, 0.911868, 0.943789]

    def test_adjustment(self):
        """Tests all the p-values adjustment methods"""
        # Library adjustment
        p_vals_adj_stats_model_bh = fdrcorrection(self.p_values)[1]
        p_vals_adj_stats_model_by = fdrcorrection(self.p_values, method='negcorr')[1]
        p_vals_adj_stats_model_bonferroni = multipletests(self.p_values, method='bonferroni')[1]

        # Own BH implementation in batches, prepare data
        total_number_of_elements = len(self.p_values)
        page_size = 4
        number_of_pages = ceil(total_number_of_elements / page_size)
        self.p_values.sort(reverse=True)  # This step is made by bh_adjustment.sort_p_values method

        # Own adjustments methods instantiation
        bh_adjustment = BenjaminiHochberg(total_number_of_elements)
        by_adjustment = BenjaminiYekutieli(total_number_of_elements)
        bonferroni_adjustment = Bonferroni(total_number_of_elements)

        # Iterates over batches
        p_vals_adj_self_bh = []
        p_vals_adj_self_by = []
        p_vals_adj_self_bonferroni = []
        for page_idx in range(number_of_pages):
            # Initialize some params
            init_pos = page_idx * page_size
            batch = self.p_values[init_pos: init_pos + page_size]

            # Prepares some adjustment parameters
            bh_adjustment.prepare_batch(len(batch))
            by_adjustment.prepare_batch(len(batch))
            bonferroni_adjustment.prepare_batch(len(batch))

            # Adjusts p-values
            for i, p_value in enumerate(batch):
                p_vals_adj_self_bh.append(bh_adjustment.adjust(p_value, i))
                p_vals_adj_self_by.append(by_adjustment.adjust(p_value, i))
                p_vals_adj_self_bonferroni.append(bonferroni_adjustment.adjust(p_value, i))

        # The Statsodels library sorts in ascending order
        p_vals_adj_self_bh.sort()
        p_vals_adj_self_by.sort()
        p_vals_adj_self_bonferroni.sort()

        for i in range(len(p_vals_adj_self_bh)):
            self.assertAlmostEqual(p_vals_adj_self_bh[i], p_vals_adj_stats_model_bh[i], places=15)
            self.assertAlmostEqual(p_vals_adj_self_by[i], p_vals_adj_stats_model_by[i], places=15)
            self.assertAlmostEqual(p_vals_adj_self_bonferroni[i], p_vals_adj_stats_model_bonferroni[i], places=15)
