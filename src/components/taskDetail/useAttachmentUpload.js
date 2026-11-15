import { createId } from "../../lib/id";
import { useToast } from "../toast/useToast";

const MAX_SIZE_IN_BYTES = 1024 * 1024;

export function useAttachmentUpload({ taskId, onAddAttachment, t }) {
  const toast = useToast();

  return function handleFileUpload(event) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    if (file.size > MAX_SIZE_IN_BYTES) {
      toast.error(t.fileTooLargeWarning);
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      onAddAttachment(taskId, {
        id: createId(),
        name: file.name,
        type: file.type,
        data: reader.result,
      });
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };
}
