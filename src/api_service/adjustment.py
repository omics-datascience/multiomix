from abc import abstractmethod
from typing import Optional, Literal
import numpy as np
# TODO: REMOVE AS ADJUSTMENT IS COMPUTED IN GGCA NOW
PValuesOrder = Optional[Literal['ASC', 'DESC']]


class AdjustmentMethod:
	total_number_of_elements: float  # Cast to float for performance
	ecdf_factor: Optional[np.ndarray]
	previous_max_p_value: float

	def __init__(self, total_number_of_elements: int):
		self.total_number_of_elements = float(total_number_of_elements)
		self.ecdf_factor = None
		self.previous_max_p_value = 999999

	@abstractmethod
	def get_p_values_order(self) -> Optional[PValuesOrder]:
		pass

	@abstractmethod
	def prepare_batch(self, elements_count: int):
		pass

	@abstractmethod
	def adjust(self, p_value: float, rank_idx: int) -> float:
		pass


class BenjaminiHochberg(AdjustmentMethod):
	initial_value: int

	def __init__(self, total_number_of_elements: int):
		super(BenjaminiHochberg, self).__init__(total_number_of_elements)
		self.initial_value = 0

	def get_p_values_order(self) -> Optional[PValuesOrder]:
		# BH needs the p-values in descending order (backward method)
		return 'DESC'

	def _generate_ecdf_factor(self, last_value: int):
		self.ecdf_factor = np.arange(self.initial_value, last_value)

	def prepare_batch(self, elements_count: int):
		last_value = self.initial_value + elements_count

		# Generates the ECDF factor
		self._generate_ecdf_factor(last_value)

		# Sets initial_value for the next iteration
		self.initial_value = last_value

	def adjust(self, p_value: float, rank_idx: int) -> float:
		rank = self.total_number_of_elements - self.ecdf_factor[rank_idx]
		q_value = min(p_value * (self.total_number_of_elements / rank), 1)
		q_value = min(q_value, self.previous_max_p_value)
		self.previous_max_p_value = q_value
		return q_value


class BenjaminiYekutieli(BenjaminiHochberg):
	"""BY only differs with BH in the ecdf factor"""
	accumulator: float

	def __init__(self, total_number_of_elements: int):
		super(BenjaminiYekutieli, self).__init__(total_number_of_elements)
		self.accumulator = np.sum(1. / np.arange(1, total_number_of_elements + 1))

	def adjust(self, p_value: float, rank_idx: int) -> float:
		rank = self.total_number_of_elements - self.ecdf_factor[rank_idx]
		adjustment_factor = (self.total_number_of_elements / rank) * self.accumulator
		q_value = min(p_value * adjustment_factor, 1)
		q_value = min(q_value, self.previous_max_p_value)
		self.previous_max_p_value = q_value
		return q_value


class Bonferroni(AdjustmentMethod):
	"""Bonferroni correction consists of multiplying the p value by the total number of tests"""
	def __init__(self, total_number_of_elements: int):
		super(Bonferroni, self).__init__(total_number_of_elements)

	def get_p_values_order(self) -> PValuesOrder:
		# Bonferroni doesn't need a rank
		return None

	def prepare_batch(self, elements_count: int):
		pass

	def adjust(self, p_value: float, _: int) -> float:
		return min(p_value * self.total_number_of_elements, 1)
