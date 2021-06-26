import numpy as np
from PIL import Image
import json

compress_rate = 0.03


def dump(number):
    img = Image.open("imgs/test/{}.jpg".format(number))
    img.thumbnail((int(img.width*compress_rate),
                   int(img.height * compress_rate)))
    img_data = np.array(img).reshape(-1, 3)
    print(img_data.shape)

    with open("imgs/test/imgData{}.json".format(number), "w") as fw:
        fw.writelines(json.dumps(img_data.tolist()))


for i in range(1, 5):
    dump(i)
