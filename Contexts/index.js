import React, { createContext, useReducer } from 'react';
import { UPLOADING_VIDEO, REGION, USER } from './actionTypes';
import Codes from '../Components/Constants/Codes';
import Utils from '../Components/utils';

//initial state
const initialState = {
  uploadingVideos: [],
  region: 'kr',
  user: {},
};

// create context
const Context = createContext({});

// 대상 항목만 교체하는 불변 업데이트 (기존 코드는 원본을 mutate + 항목을 맨 뒤로 밀어 순서가 튀었음)
const updateUploadingVideo = (state, id, patch) => ({
  ...state,
  uploadingVideos: state.uploadingVideos.map((item) =>
    item.id === id ? { ...item, ...patch } : item,
  ),
});

// create reducer
const reducer = (state = initialState, action) => {
  const video = state.uploadingVideos.find((item) => item.id === action.id);
  const addedUploadingVideo = {
    id: action.id,
    state: action.initialState ? action.initialState : Codes.UPLOADING_VIDEO_STATE.STANDBY,
    ...action.payload,
  };

  switch (action.type) {
    case UPLOADING_VIDEO.ADD:
      return {
        ...state,
        uploadingVideos: [...state.uploadingVideos, addedUploadingVideo],
      };
    case UPLOADING_VIDEO.DELETE:
      return {
        ...state,
        uploadingVideos: state.uploadingVideos.filter((item) => action.id !== item.id),
      };
    case UPLOADING_VIDEO.UPLOAD:
      if (!video) {
        return state;
      }
      return updateUploadingVideo(state, action.id, {
        state: Codes.UPLOADING_VIDEO_STATE.UPLOADING,
      });
    case UPLOADING_VIDEO.UPLOAD_PROGRESS:
      if (!video) {
        return state;
      }
      return updateUploadingVideo(state, action.id, { progress: action.value });
    case UPLOADING_VIDEO.UPLOAD_COMPLETE:
      if (!video) {
        return state;
      }
      return updateUploadingVideo(state, action.id, {
        state: Codes.UPLOADING_VIDEO_STATE.UPLOADED,
      });
    case UPLOADING_VIDEO.UPLOAD_ERROR:
      if (!video) {
        return state;
      }
      return updateUploadingVideo(state, action.id, { state: Codes.UPLOADING_VIDEO_STATE.ERROR });
    case UPLOADING_VIDEO.STOP:
      if (!video || !video.videoProcessingId) {
        return state;
      }
      Utils.stopVideoProcessing(video.videoProcessingId);
      return updateUploadingVideo(state, action.id, { state: Codes.UPLOADING_VIDEO_STATE.STOPPED });
    case REGION.SET:
      const { value } = action;
      if (value !== 'kr' && value !== 'us') {
        return state;
      }
      return {
        ...state,
        region: value,
      };
    case USER.SET:
      return {
        ...state,
        user: action.value,
      };
    case USER.UPDATE:
      return {
        ...state,
        user: { ...state.user, ...action.value },
      };
    case USER.DELETE:
      return {
        ...state,
        user: {},
      };
    default:
      return state;
  }
};

// create Provider component (High order component)
const ContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = { state, dispatch };
  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export { Context, ContextProvider };
