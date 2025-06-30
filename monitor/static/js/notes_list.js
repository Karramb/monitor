<script>
  async function fetchData(url) {
    const res = await fetch(url);
    return await res.json();
  }

  async function loadPage() {
    const [notes, tags, groups] = await Promise.all([
      fetchData('/api/notes/'),
      fetchData('/api/tags/'),
      fetchData('/api/groups/')
    ]);

    const tagSelect = document.getElementById('filterTag');
    const groupSelect = document.getElementById('filterGroup');

    tags.forEach(tag => {
      tagSelect.innerHTML += `<option value="${tag.id}">${tag.name}</option>`;
    });

    groups.forEach(group => {
      groupSelect.innerHTML += `<option value="${group.id}">${group.name}</option>`;
    });

    function renderTable(filteredNotes) {
      const tbody = document.getElementById('notesTableBody');
      if (filteredNotes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Нет заметок</td></tr>';
        return;
      }

      tbody.innerHTML = filteredNotes.map(note => `
        <tr>
          <td><strong>${note.theme}</strong></td>
          <td>${note.text.slice(0, 100)}...</td>
          <td>${new Date(note.pub_date).toLocaleString()}</td>
          <td>${note.author}</td>
          <td>
            ${note.tags.map(tag => `<span class="badge bg-secondary me-1">${tag.name}</span>`).join('')}
          </td>
          <td>${note.groups.name}</td>
        </tr>
      `).join('');
    }

    function applyFilters() {
      const tagId = tagSelect.value;
      const groupId = groupSelect.value;
      const filtered = notes.filter(note => {
        const tagMatch = tagId ? note.tags.some(tag => tag.id == tagId) : true;
        const groupMatch = groupId ? note.groups.id == groupId : true;
        return tagMatch && groupMatch;
      });
      renderTable(filtered);
    }

    tagSelect.addEventListener('change', applyFilters);
    groupSelect.addEventListener('change', applyFilters);

    renderTable(notes);
  }

  function handleCreateNote() {
    // сюда можно вставить редирект или открыть модалку
    console.log('Создание заметки');
  }

  document.addEventListener('DOMContentLoaded', loadPage);
</script>
