const initState = {
  currentMode: 'hlb',
};

const dewMainReducer = (state = initState, action) => {
  if (action.type === "SWITCH_MODE") {
    return {
      ...state,
      currentMode: action.currentMode
    };
  }
  return state;
};
export default dewMainReducer