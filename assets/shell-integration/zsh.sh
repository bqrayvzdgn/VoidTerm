# VoidTerm Shell Integration for Zsh
# Emits OSC 633 sequences for command tracking

if [ -n "$VOIDTERM_SHELL_INTEGRATION" ]; then
  return 0 2>/dev/null || exit 0
fi
export VOIDTERM_SHELL_INTEGRATION=1

__voidterm_precmd() {
  local exit_code=$?
  printf '\e]633;D;%s\a' "$exit_code"
  printf '\e]633;P;Cwd=%s\a' "$PWD"
  printf '\e]633;A\a'
  printf '\e]633;B\a'
}

__voidterm_preexec() {
  printf '\e]633;E;%s\a' "$1"
  printf '\e]633;C\a'
}

autoload -Uz add-zsh-hook
add-zsh-hook precmd __voidterm_precmd
add-zsh-hook preexec __voidterm_preexec
