# VoidTerm Shell Integration for Fish
# Emits OSC 633 sequences for command tracking

if set -q VOIDTERM_SHELL_INTEGRATION
    exit 0
end
set -gx VOIDTERM_SHELL_INTEGRATION 1

function __voidterm_prompt --on-event fish_prompt
    set -l exit_code $status
    printf '\e]633;D;%s\a' $exit_code
    printf '\e]633;P;Cwd=%s\a' $PWD
    printf '\e]633;A\a'
    printf '\e]633;B\a'
end

function __voidterm_preexec --on-event fish_preexec
    printf '\e]633;E;%s\a' $argv[1]
    printf '\e]633;C\a'
end
