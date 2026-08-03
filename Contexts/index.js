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
      video.state = Codes.UPLOADING_VIDEO_STATE.UPLOADING;
      return {
        ...state,
        uploadingVideos: [...state.uploadingVideos.filter((item) => action.id !== item.id), video],
      };
    case UPLOADING_VIDEO.UPLOAD_PROGRESS:
      if (!video) {
        return state;
      }
      video.progess = action.value;
      return {
        ...state,
        uploadingVideos: [...state.uploadingVideos.filter((item) => action.id !== item.id), video],
      };
    case UPLOADING_VIDEO.UPLOAD_COMPLETE:
      if (!video) {
        return state;
      }
      video.state = Codes.UPLOADING_VIDEO_STATE.UPLOADED;
      return {
        ...state,
        uploadingVideos: [...state.uploadingVideos.filter((item) => action.id !== item.id), video],
      };
    case UPLOADING_VIDEO.UPLOAD_ERROR:
      if (!video) {
        return state;
      }
      video.state = Codes.UPLOADING_VIDEO_STATE.ERROR;
      return {
        ...state,
        uploadingVideos: [...state.uploadingVideos.filter((item) => action.id !== item.id), video],
      };
    case UPLOADING_VIDEO.STOP:
      if (!video || !video.videoProcessingId) {
        return state;
      }
      Utils.stopVideoProcessing(video.videoProcessingId);
      video.state = Codes.UPLOADING_VIDEO_STATE.STOPPED;
      return {
        ...state,
        uploadingVideos: [...state.uploadingVideos.filter((item) => action.id !== item.id), video],
      };
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
