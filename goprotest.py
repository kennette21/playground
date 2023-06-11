import requests

from goprocam import GoProCamera, constants
from PIL import Image
import time
from io import BytesIO

goproCamera = GoProCamera.GoPro()

goproCamera.take_photo(timer=1)
# time.sleep(2)
mediaUrl = goproCamera.getMedia()
response = requests.get(mediaUrl)
image = Image.open(BytesIO(response.content))
image.show()
