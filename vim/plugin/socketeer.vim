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

except socket.error as error:
    if error.errno is errno.ECONNREFUSED:
        if vim.eval("g:ghPreview_autoStart") == '1':
            subprocess.Popen(["gh-preview", vim.eval("g:ghPreview_port")])
            webbrowser.open("http://localhost:"+vim.eval("g:ghPreview_port"))

vim.command("let s:locked=0")
EOF
endfu

fu! s:initBuffer()
    aug socketeer
        au! * <buffer>
        au BufEnter <buffer> call s:update()
        au CursorHold,CursorHoldI,CursorMoved,CursorMovedI <buffer> call s:update()
    aug END
    call s:update()
endfu

aug socketeer
    au FileType markdown call s:initBuffer()
aug END
