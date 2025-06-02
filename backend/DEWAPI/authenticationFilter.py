from flask import request
import re
from DEWAPI.user import userObj
from DEWAPI.api.public.services.userinfoservice import GoogleLogin

privateUrlpattern = "^/api/v1/pr/*"
publicUrlpattern = "^/api/v1/p/*"

login = GoogleLogin()

class AuthFilter():
    
    def checkCors(self):
        # logic for verifying tokens
        print('inside Cors filter')
        # path = request.path
        url = request.url_root
        header = request.headers
        origin = "8800"
        # origin = header['Origin']
        # print(origin)
        # print(url)
        if origin in url:
            return True, None
        else:
            return True, "Unauthorized usage."
        
    def isUrlPathPrivate(self):
        path = request.path
        privateUrlProgPattern = re.compile(privateUrlpattern)
        publicUrlProgPattern = re.compile(publicUrlpattern)
        matchPRResult = privateUrlProgPattern.match(path)
        matchPResult = publicUrlProgPattern.match(path)
        if matchPRResult is not None:
            return True, True, None
        elif matchPResult is not None:
            return False, True, None
        elif path == '/api/swagger.json':
            return False, True, None
        elif path == '/api/':
            return False, True, None
        else:
            return False, False, "Unauthorized usage."
        
    def authorizeUser(self):
        cookies = request.cookies
        if 'token' in cookies:
            user = login.getLoginUserDetail(cookies['token'])
            if user is not None:
                userObj.setToken(cookies['token'])
                userObj.setUserId(user['userId'])
                userObj.setUserHandle(user['userHandle'])
                userObj.setEmailId(user['emailId'])
                return False, None
         
        return True, 'Unauthorized Access'
        

            
        
        

