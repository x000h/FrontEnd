import { DragEvent, useRef, useState } from 'react';

const MAX_MB = 10;

export default function UploadBox({ onSelect, disabled }: { onSelect: (file: File) => void; disabled?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const validate = (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setError('JPG 또는 PNG 이미지만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`이미지 용량은 ${MAX_MB}MB 이하만 가능합니다.`);
      return;
    }
    setError('');
    onSelect(file);
  };

  const drop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (!disabled) validate(e.dataTransfer.files?.[0]);
  };

  return (
    <div>
      <div
        className={`upload-box ${dragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !disabled) inputRef.current?.click(); }}
      >
        <div className="upload-icon">↑</div>
        <strong>{dragging ? '여기에 놓아주세요' : '검사 이미지를 업로드하세요'}</strong>
        <span>파일을 드래그하거나 클릭해서 선택</span>
        <small>JPG / PNG · 최대 {MAX_MB}MB</small>
        <small className="upload-hint">현장에서는 카메라 전달 이미지가 동일한 검사 입력으로 처리됩니다.</small>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg" hidden onChange={(e) => { validate(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}
