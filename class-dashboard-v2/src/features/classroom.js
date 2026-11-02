export function applyClassroomCommand(state, command, newId) {
  switch (command.type) {
    case 'SET_CLASS_NAME':
      if (typeof command.name !== 'string') throw new Error('請輸入班級名稱。');
      state.classroom.name = command.name.trim(); break;
    case 'ADD_STUDENT':
      state.students.push({id: newId(), seat: command.seat, name: String(command.name ?? '').trim()}); break;
    case 'UPDATE_STUDENT': {
      const student = state.students.find(s => s.id === command.id);
      if (!student) throw new Error('找不到學生，請重新開啟設定。');
      student.seat = command.seat; student.name = String(command.name ?? '').trim(); break;
    }
    default: throw new Error('不支援的操作。');
  }
  return state;
}
