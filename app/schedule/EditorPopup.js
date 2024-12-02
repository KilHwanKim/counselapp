import React from "react";
import Quill from "react-quill";
import "react-quill/dist/quill.snow.css";

const EditorPopup = ({ isPopupOpen, closePopup }) => {
  const [content, setContent] = React.useState("<p>기본 텍스트를 여기에 입력하세요</p>");

  const saveContent = () => {
    alert("저장된 내용: " + content);
    closePopup();
  };

  if (!isPopupOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-3/4 max-w-2xl">
        <h2 className="text-xl font-bold mb-4">글 수정</h2>
        <Quill
          theme="snow"
          value={content}
          onChange={setContent}
          className="mb-4"
        />
        <div className="flex justify-end space-x-4">
          <button
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            onClick={closePopup}
          >
            취소
          </button>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={saveContent}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorPopup;
