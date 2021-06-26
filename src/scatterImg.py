import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from PIL import Image

compress_rate = 0.2


def get_color(number):
    img = Image.open("imgs/test/{}.jpg".format(number))
    img.thumbnail((int(img.width*compress_rate),
                   int(img.height * compress_rate)))
    img_data = np.array(img).reshape(-1, 3)
    print(img_data.shape)

    def arr2hex(x): return '#%02x%02x%02x' % (x[0], x[1], x[2])

    r = img_data[:, 0]
    g = img_data[:, 1]
    b = img_data[:, 2]
    c = list(map(arr2hex, img_data))

    fig = plt.figure()
    ax = plt.axes(projection='3d')
    ax.scatter3D(r, g, b, c=c, alpha=0.3, s=1)
    ax.set_xlabel('R', fontsize=20)
    ax.set_ylabel('G', fontsize=20)
    ax.set_zlabel('B', fontsize=20)
    plt.savefig("imgs/blog/{}.jpg".format(number))


for i in range(1, 5):
    get_color(i)
