from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


def send_message(group_name, message):
    """
    General function to send a WS message
    @param group_name: Channel dest to send te message
    @param message: Message to send
    """
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(group_name, {
        "type": "send_message",
        "message": message
    })


def send_update_experiments_command(user_id: int):
    """
    Sends a message indicating that an Experiment's state update has occurred
    @param user_id: Experiment's user's id to send the WS message
    """
    user_group_name = f'notifications_{user_id}'
    message = {
        'command': 'update_experiments'
    }
    send_message(user_group_name, message)


def send_update_cgds_studies_command():
    """
    Sends a message indicating that an CGDSStudy's state update has occurred
    """
    user_group_name = "admin_notifications"
    message = {
        'command': 'update_cgds_studies'
    }
    send_message(user_group_name, message)


def send_update_biomarkers_command(user_id: int):
    """
    Sends a message indicating that an Biomarker's state update has occurred
    """
    user_group_name = f'notifications_{user_id}'
    message = {
        'command': 'update_biomarkers'
    }
    send_message(user_group_name, message)


def send_update_user_file_command(user_id: int):
    """
    Sends a message indicating that an user file's state update has occurred
    """
    user_group_name = f'notifications_{user_id}'
    message = {
        'command': 'update_user_files'
    }
    send_message(user_group_name, message)


def send_update_stat_validations_command(user_id: int):
    """
    Sends a message indicating that an StatisticalValidation state update has occurred
    @param user_id: StatisticalValidation's user's id to send the WS message
    """
    user_group_name = f'notifications_{user_id}'
    message = {
        'command': 'update_statistical_validations'
    }
    send_message(user_group_name, message)


def send_update_trained_models_command(user_id: int):
    """
    Sends a message indicating that a TrainedModel state update has occurred
    @param user_id: TrainedModel's user's id to send the WS message
    """
    user_group_name = f'notifications_{user_id}'
    message = {
        'command': 'update_trained_models'
    }
    send_message(user_group_name, message)
