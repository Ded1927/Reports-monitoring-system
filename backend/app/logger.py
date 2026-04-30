import logging
import contextvars
import datetime
from pythonjsonlogger import jsonlogger

# Context variables to hold request-scoped metadata
request_id_var = contextvars.ContextVar("request_id", default=None)
user_id_var = contextvars.ContextVar("user_id", default=None)

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super(CustomJsonFormatter, self).add_fields(log_record, record, message_dict)
        if not log_record.get('timestamp'):
            now = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%fZ')
            log_record['timestamp'] = now
        if log_record.get('level'):
            log_record['level'] = log_record['level'].upper()
        else:
            log_record['level'] = record.levelname
            
        req_id = request_id_var.get()
        if req_id:
            log_record['request_id'] = req_id
            
        usr_id = user_id_var.get()
        if usr_id:
            log_record['user_id'] = usr_id

def setup_logger():
    logger = logging.getLogger("cyber_mon")
    logger.setLevel(logging.INFO)
    logger.propagate = False
    
    if not logger.handlers:
        logHandler = logging.StreamHandler()
        formatter = CustomJsonFormatter('%(timestamp)s %(level)s %(name)s %(message)s')
        logHandler.setFormatter(formatter)
        logger.addHandler(logHandler)
        
    return logger

logger = setup_logger()
