python << EOF
import vim
EOF

fu! s:update()
python << EOF
import httplib
import json
try:
    connection = httplib.HTTPConnection('localhost', 1234)
    connection.request(
        'POST'
        , '/input'
        , json.dumps({
            'file':    vim.current.buffer.name
          , 'content': '\n'.join(vim.current.buffer).decode('utf-8')
        })
    )
    connection.close()
except:
    pass
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
