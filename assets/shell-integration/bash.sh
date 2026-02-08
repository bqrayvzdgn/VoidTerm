# VoidTerm Shell Integration for Bash
# Emits OSC 633 sequences for command tracking

if [ -n "$VOIDTERM_SHELL_INTEGRATION" ]; then
  return 0 2>/dev/null || exit 0
fi
export VOIDTERM_SHELL_INTEGRATION=1

__voidterm_prompt_command() {
  local exit_code=$?
  printf '\e]633;D;%s\a' "$exit_code"
  printf '\e]633;P;Cwd=%s\a' "$PWD"
  printf '\e]633;A\a'
}

__voidterm_preexec() {
  printf '\e]633;E;%s\a' "$BASH_COMMAND"
  printf '\e]633;C\a'
}

PROMPT_COMMAND="__voidterm_prompt_command${PROMPT_COMMAND:+;$PROMPT_COMMAND}"
trap '__voidterm_preexec' DEBUG
printf '\e]633;B\a'
