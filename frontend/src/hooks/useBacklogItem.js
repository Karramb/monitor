import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const getAccessToken = () => localStorage.getItem('token');
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${getAccessToken()}`,
});

const useBacklogItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentFiles, setCommentFiles] = useState([]);
  const [groupsMap, setGroupsMap] = useState({});
  const [tagsMap, setTagsMap] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editedTheme, setEditedTheme] = useState('');
  const [editedText, setEditedText] = useState('');
  const [editedStatus, setEditedStatus] = useState('');
  const [editedTags, setEditedTags] = useState([]);
  const [editedAttachments, setEditedAttachments] = useState([]);
  const [filesToDelete, setFilesToDelete] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [taskRes, commentsRes, groupsRes, tagsRes, userRes] = await Promise.all([
          axios.get(`/api/backlog/${id}/`, { headers: getAuthHeaders() }),
          axios.get(`/api/backlog/${id}/comments/`, { headers: getAuthHeaders() }),
          axios.get('/api/groups/', { headers: getAuthHeaders() }),
          axios.get('/api/tags/', { headers: getAuthHeaders() }),
          axios.get('/api/users/me/', { headers: getAuthHeaders() }),
        ]);

        setTask(taskRes.data);
        setEditedTheme(taskRes.data.theme);
        setEditedText(taskRes.data.text);
        setEditedStatus(taskRes.data.status);
        setEditedTags(taskRes.data.tags || []);
        setComments(commentsRes.data);
        setCurrentUser(userRes.data);

        const groups = Object.fromEntries(groupsRes.data.map(group => [group.id, group]));
        const tags = Object.fromEntries(tagsRes.data.map(tag => [tag.id, tag]));

        setGroupsMap(groups);
        setTagsMap(tags);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        navigate('/backlog');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const isAuthor = currentUser && task?.author === currentUser.username;

  const handleDeleteFile = (fileId) => {
    setFilesToDelete(prev => [...prev, fileId]);
  };

  const handleCancelDeleteFile = (fileId) => {
    setFilesToDelete(prev => prev.filter(id => id !== fileId));
  };

  const handleSaveTask = async () => {
    try {
      const formData = new FormData();
      formData.append('theme', editedTheme);
      formData.append('text', editedText);
      formData.append('status', editedStatus);
      editedTags.forEach(tagId => formData.append('tags', tagId));
      editedAttachments.forEach(file => formData.append('attachments', file));

      await axios.patch(`/api/backlog/${id}/`, formData, {
        headers: getAuthHeaders(),
      });

      for (const fileId of filesToDelete) {
        try {
          await axios.delete(`/api/backlog/${id}/attachments/${fileId}/`, {
            headers: getAuthHeaders(),
          });
        } catch (error) {
          console.error('Ошибка удаления файла:', error);
        }
      }

      const updatedTaskRes = await axios.get(`/api/backlog/${id}/`, { headers: getAuthHeaders() });
      setTask(updatedTaskRes.data);
      setIsEditing(false);
      setEditedAttachments([]);
      setFilesToDelete([]);
    } catch (error) {
      console.error('Ошибка сохранения задачи:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditedTheme(task.theme);
    setEditedText(task.text);
    setEditedStatus(task.status);
    setEditedTags(task.tags || []);
    setEditedAttachments([]);
    setFilesToDelete([]);
    setIsEditing(false);
  };

  const handleCommentFileChange = (e) => {
    const files = Array.from(e.target.files);
    setCommentFiles(prev => [...prev, ...files]);
    e.target.value = null;
  };

  const handleEditedAttachmentsChange = (e) => {
    const files = Array.from(e.target.files);
    setEditedAttachments(prev => [...prev, ...files]);
    e.target.value = null;
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const formData = new FormData();
    formData.append('text', newComment);
    commentFiles.forEach(file => formData.append('attachments', file));

    try {
      const response = await axios.post(`/api/backlog/${id}/comments/`, formData, {
        headers: getAuthHeaders(),
      });

      setComments([response.data, ...comments]);
      setNewComment('');
      setCommentFiles([]);
    } catch (error) {
      console.error('Ошибка при отправке комментария:', error);
    }
  };

  return {
    task,
    comments,
    newComment,
    commentFiles,
    groupsMap,
    tagsMap,
    currentUser,
    loading,

    isEditing,
    editedTheme,
    editedText,
    editedStatus,
    editedTags,
    editedAttachments,
    filesToDelete,

    isAuthor,

    setNewComment,
    setCommentFiles,
    setIsEditing,
    setEditedTheme,
    setEditedText,
    setEditedStatus,
    setEditedTags,

    handleDeleteFile,
    handleCancelDeleteFile,
    handleSaveTask,
    handleCancelEdit,
    handleCommentFileChange,
    handleEditedAttachmentsChange,
    handleAddComment,
  };
};

export default useBacklogItem;
