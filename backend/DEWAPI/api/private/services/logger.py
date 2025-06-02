import os
from datetime import datetime, date

class Logger(object):
    def log(user, message):
        try:
            message = message + "\n"
            path = "/var/log/DEW/" + user + "/"
            #path = "C:/Users/allan/Desktop/ISI Work/DEW GitHub Repo/STEELISI - DEW/backend/logs/DEW/" + user + "/"
            if (not os.path.exists(path)):
                os.makedirs(path)
            path = path + "dew_" + str(date.today()) + "_logs.log"
            file = open(path, "a")  # append mode
            file.write(message)
            file.close()
            return "Logged Successfully"
        except BaseException as err:
            return str(err)
    
    def backendErrorLog(user, message):
        try:
            now = datetime.now()
            dt_string = now.strftime("%m/%d/%Y %I:%M:%S %p")
            log = dt_string + " | BACKEND ERROR: "
            message = log + str(message)
            message = message + "\n"
            path = "/var/log/DEW/" + user + "/"
            #path = "C:/Users/allan/Desktop/ISI Work/DEW GitHub Repo/STEELISI - DEW/backend/logs/DEW/" + user + "/"
            if (not os.path.exists(path)):
                os.makedirs(path)
            path = path + "dew_" + str(date.today()) + "_logs.log"
            file = open(path, "a")  # append mode
            file.write(message)
            file.close()
            return "Logged Successfully"
        except BaseException as err:
            return str(err)

    def backendLog(user, function, message):
        try:
            now = datetime.now()
            dt_string = now.strftime("%m/%d/%Y %I:%M:%S %p")
            log = dt_string + " | BACKEND INFO: (CLASS: " + function + ") "
            message = log + str(message)
            message = message + "\n"
            path = "/var/log/DEW/" + user + "/"
            #path = "C:/Users/allan/Desktop/ISI Work/DEW GitHub Repo/STEELISI - DEW/backend/logs/DEW/" + user + "/"
            if (not os.path.exists(path)):
                os.makedirs(path)
            path = path + "dew_" + str(date.today()) + "_logs.log"
            file = open(path, "a")  # append mode
            file.write(message)
            file.close()
            return "Logged Successfully"
        except BaseException as err:
            return str(err)