if !has('python')
  echoerr 'Error: ghp requires Vim compiled with +python'
  finish
endif

if exists('g:ghp_loaded')
  finish
endif

let g:ghp_loaded = 1

"Load python/ghp.py
let s:py_path = join([expand('<sfile>:p:h:h'), 'python'], '/')
exec "python sys.path.append(r'" . s:py_path . "')"
exec "python import ghp"

" Default value for port
let g:ghp_port = get(g:, 'ghp_port', 1234)

" Start the server automatically?
let g:ghp_start_server = get(g:, 'ghp_start_server', 1)

" Open the browser automatically?
let g:ghp_open_browser = get(g:, 'ghp_open_browser', 1)

" Perform disposal logic
fu! s:dispose()
    call Ghp#Stop()
endfu

" Prepare a buffer for being previewed
fu! s:initBuffer()
    call Ghp#Start()
    aug ghp
        au! * <buffer>
        au BufEnter <buffer> call Ghp#Preview()
        au CursorHold,CursorHoldI,CursorMoved,CursorMovedI <buffer> call Ghp#Preview()
    aug END
endfu

" Register all markdown buffers for preview
aug ghp
    au FileType markdown call s:initBuffer()
    au VimLeave * call s:dispose()
aug END
