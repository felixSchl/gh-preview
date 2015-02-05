from socketIO_client import SocketIO


print('con')
with SocketIO('localhost', 1234, params={'type':'input'}) as socket:
    print('con')
    socket.emit('data', "**so was von egal**")

