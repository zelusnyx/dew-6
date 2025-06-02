export const switchModeAction = (currentMode) => {
  return (dispatch) => {
    dispatch({ type: "SWITCH_MODE", currentMode });
  }
}