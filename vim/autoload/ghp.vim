if !has('python')
  finish
endif

let s:save_cpo = &cpo
set cpo&vim

function! Ghp#Start() abort
  python ghp.start()
endfunction

function! Ghp#Preview() abort
  python ghp.preview()
endfunction

function! Ghp#Stop() abort
  python ghp.stop()
endfunction

let &cpo = s:save_cpo
unlet s:save_cpo
