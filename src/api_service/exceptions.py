class ExperimentFailed(Exception):
    """Raised when the experiment has failed for some reason"""
    pass


class NoSamplesInCommon(Exception):
    """Raised when the experiment has no samples in common between its bots sources"""
    pass


class CouldNotDeleteInMongo(Exception):
    """Raised when could not deleted the associated tuples in MongoDB for a particular experiment's result"""
    pass
