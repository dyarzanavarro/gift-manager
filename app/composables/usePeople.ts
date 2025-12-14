import { mockPeople } from '~/data/mockPeople';
import type { Person } from '~/models/person';
import { ref } from 'vue';


export const usePeople = () => {
    // state management for people
    const people = useState<Person[]>('people', () => [...mockPeople]);

    const nextId = computed(
        () => (people.value.length ? Math.max(...people.value.map(p => p.id)) + 1 : 1)
    );

    // adding, updating, deleting people

    const addPerson = (payload: Omit<Person, 'id'>) => {
        people.value.push({
            id: nextId.value,
            ...payload
        });
    };

    const updatePerson = (id: number, payload: Omit<Person, 'id'>) => {
        const index = people.value.findIndex(p => p.id === id);
        if (index === -1) return;
        people.value[index] = { id, ...payload };
    };

    const deletePerson = (id: number) => {
        people.value = people.value.filter(p => p.id !== id);
    };

    const getPersonById = (id: number) => {
        return people.value.find(p => p.id === id);
    };

    return {
        people,
        addPerson,
        updatePerson,
        deletePerson,
        getPersonById
    };
}