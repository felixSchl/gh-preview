" Function: s:initVariable() function
" Initialise a given variable to a given value
" Borrowed from NERD_tree.vim
fu! s:initVariable(var, value)
    if !exists(a:var)
        exe 'let ' . a:var . ' = ' . "'" . substitute(a:value, "'", "''", "g") . "'"
        ret 1
    endif
    ret 0
endfu

" Initialise variables
call s:initVariable("g:ghPreview_port", 1234)
call s:initVariable("g:ghPreview_autoStart", 1)

python << EOF
import vim
import sys

PROCESS    = None
HAS_OPENED = False

def start_browser(url):
    command =\
         'open -g'  if sys.platform.startswith('darwin')\
    else 'start'    if sys.platform.startswith('win')\
    else 'xdg-open'
    os.system(command + ' ' + url)
EOF

let s:locked=0
fu! s:update()
    if s:locked == 1
        ret
    endif
    let s:locked = 1
python << EOF
import httplib
import json
import errno
import socket
import subprocess
import webbrowser
import platform

success = False

try:
    connection = httplib.HTTPConnection(
          'localhost'
        , vim.eval("g:ghPreview_port")
    )
    connection.request(
        'POST'
        , '/input'
        , json.dumps({
            'file':    vim.current.buffer.name
          , 'content': '\n'.join(vim.current.buffer).decode('utf-8')
        })
    )
    connection.close()

    sucess = True

except socket.error as error:
    if error.errno is errno.ECONNREFUSED and\
       vim.eval("g:ghPreview_autoStart") == '1' and\
       PROCESS is None:
            try:
                PROCESS = subprocess.Popen(
                      ["gh-preview", vim.eval("g:ghPreview_port")]
                    , bufsize = 0
                    , stdin   = subprocess.PIPE
                    , stdout  = subprocess.PIPE
                    , stderr  = subprocess.PIPE
                )

                success = True

            except:
                pass

finally:
    vim.command("let s:locked=0")

if success and not HAS_OPENED:
    HAS_OPENED = True
    start_browser('http://localhost:%s/' % vim.eval("g:ghPreview_port"))

EOF
endfu

fu! s:cleanup()
python << EOF
if PROCESS is not None:
    PROCESS.kill()
EOF
endfu

fu! s:initBuffer()
    aug ghPreview
        au! * <buffer>
        au BufEnter <buffer> call s:update()
        au CursorHold,CursorHoldI,CursorMoved,CursorMovedI <buffer> call s:update()
        au VimLeavePre call s:cleanup()
    aug END
    call s:update()
endfu

aug ghPreview
    au FileType markdown call s:initBuffer()
aug END
