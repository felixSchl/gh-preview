import time
import Queue
import httplib
import threading
import subprocess
import json
import vim
import sys
import socket

queue = Queue.Queue(1)

def push(stop_event, port, auto_start_server):
    process = None
    process_failed = False
    while(not stop_event.is_set()):
        data = queue.get()

        connection = httplib.HTTPConnection('localhost', port, timeout=1)
        try:
            connection.request('POST', '/input', data)
            connection.close()
        except (socket.error, socket.timeout, httplib.HTTPException):
            if not process \
               and not process_failed \
               and auto_start_server:
                startupinfo = None
                if sys.platform == 'win32':
                    command = "gh-preview.cmd"
                    startupinfo = subprocess.STARTUPINFO()
                    startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                    pipe = None
                else:
                    command = "gh-preview"
                    pipe = subprocess.PIPE
                try:
                    process = subprocess.Popen(
                        [command, port]
                      , bufsize = 0
                      , startupinfo = startupinfo
                      , stdin = pipe
                      , stdout = pipe
                      , stderr = pipe
                    )
                except Exception, e:
                    process_failed = True
        except Exception, e:
            print(type(e))

        queue.task_done()
    if process is not None:
        process.kill()

def preview():
    try:
        queue.put(
            json.dumps({
                'file': vim.current.buffer.name
              , 'markdown': '\n'.join(vim.current.buffer).decode('utf-8')
            })
          , block = False
        )
    except:
        pass

ghp_t = None
ghp_t_stop = None
ghp_started = False

def stop():

    global ghp_t
    global ghp_t_stop
    global ghp_started

    if not ghp_started:
        return
    ghp_started = False

    ghp_t_stop.set()
    ghp_t._Thread__stop()

def start():

    global ghp_t
    global ghp_t_stop
    global ghp_started

    if ghp_started:
        return
    ghp_started = True

    ghp_t_stop = threading.Event()
    ghp_t = threading.Thread(target=push, args=(
        ghp_t_stop
      , vim.eval("g:ghp_port")
      , vim.eval("g:ghp_start_server")
    ))
    ghp_t.start()
