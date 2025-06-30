import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [tags, setTags] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filterTag, setFilterTag] = useState('');
  const [filterGroup, setFilterGroup] = useState('');

  useEffect(() => {
    fetchNotes();
    axios.get('/api/tags/').then(res => setTags(res.data));
    axios.get('/api/groups/').then(res => setGroups(res.data));
  }, []);

  const fetchNotes = () => {
    axios.get('/api/notes/').then(res => setNotes(res.data));
  };

  const filteredNotes = notes.filter(note => {
    const matchTag = filterTag ? note.tags.some(tag => tag.id === parseInt(filterTag)) : true;
    const matchGroup = filterGroup ? note.groups.id === parseInt(filterGroup) : true;
    return matchTag && matchGroup;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Заметки</h1>
        <button
          onClick={() => console.log('Создание заметки')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow"
        >
          + Создать
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <select
          className="p-2 border rounded-xl"
          value={filterTag}
          onChange={e => setFilterTag(e.target.value)}
        >
          <option value=''>Все теги</option>
          {tags.map(tag => (
            <option key={tag.id} value={tag.id}>{tag.name}</option>
          ))}
        </select>

        <select
          className="p-2 border rounded-xl"
          value={filterGroup}
          onChange={e => setFilterGroup(e.target.value)}
        >
          <option value=''>Все группы</option>
          {groups.map(group => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full table-auto border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Тема</th>
              <th className="p-2 text-left">Текст</th>
              <th className="p-2 text-left">Дата</th>
              <th className="p-2 text-left">Автор</th>
              <th className="p-2 text-left">Теги</th>
              <th className="p-2 text-left">Группа</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotes.map(note => (
              <tr key={note.id} className="border-t">
                <td className="p-2 font-semibold">{note.theme}</td>
                <td className="p-2 text-sm text-gray-700">{note.text.slice(0, 100)}...</td>
                <td className="p-2 text-sm">{new Date(note.pub_date).toLocaleString()}</td>
                <td className="p-2 text-sm">{note.author}</td>
                <td className="p-2 text-sm space-x-1">
                  {note.tags.map(tag => (
                    <span key={tag.id} className="inline-block px-2 py-0.5 rounded text-xs bg-gray-200">
                      {tag.name}
                    </span>
                  ))}
                </td>
                <td className="p-2 text-sm">{note.groups.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
