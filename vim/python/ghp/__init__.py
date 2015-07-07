import time
import Queue
import httplib
import threading
import subprocess
import json
import vim
import sys
import socket


ghp_process = None
ghp_t = None
ghp_t_stop = None
ghp_started = False
ghp_queue = Queue.Queue(1)


def terminate_process(pid):
    if sys.platform == 'win32':
        import ctypes
        PROCESS_TERMINATE = 1
        handle = ctypes.windll.kernel32.OpenProcess(PROCESS_TERMINATE, False, pid)
        ctypes.windll.kernel32.TerminateProcess(handle, -1)
        ctypes.windll.kernel32.CloseHandle(handle)
    else:
        os.kill(pid, signal.SIGKILL)



def push(stop_event, port, auto_start_server):
    global ghp_process
    process_failed = False
    while(not stop_event.is_set()):
        data = ghp_queue.get()

        connection = httplib.HTTPConnection('localhost', port, timeout=1)
        try:
            connection.request('POST', '/input', data)
            connection.close()
        except (socket.error, socket.timeout, httplib.HTTPException):
            if not ghp_process \
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
                    ghp_process = subprocess.Popen(
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

        ghp_queue.task_done()
    if ghp_process is not None:
        terminate_process(ghp_process.pid)

def preview():
    global ghp_queue
    try:
        ghp_queue.put(
            json.dumps({
                'file': vim.current.buffer.name
              , 'markdown': '\n'.join(vim.current.buffer).decode('utf-8')
            })
          , block = False
        )
    except:
        pass

def stop():

    global ghp_t
    global ghp_t_stop
    global ghp_started
    global ghp_process

    if not ghp_started:
        return
    ghp_started = False

    ghp_t_stop.set()
    ghp_t._Thread__stop()

    if ghp_process is not None:
        terminate_process(ghp_process.pid)

def start():

    global ghp_t
    global ghp_t_stop
    global ghp_started
    global ghp_process

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
