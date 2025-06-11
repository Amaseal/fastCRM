import type {
    Task,
    Client, 
    User,
    Tab,
    Tag,
    Product, 
    Material, 
    File 
} from '$lib/server/db/schema';

export type TaskWithRelations = Task & {
    client?: Client;
    manager?: User;
    responsiblePerson?: User;
    materials?: { material: Material }[]; // Use the junction table relationship
    taskProducts?: { product: Product }[]; // Use the junction table relationship
    files?: File[]; // Add files relation
};

export type TabWithRelations = Tab & {
	tag?: Tag;
};

export type TabWithTasks = TabWithRelations & {
	tasks: TaskWithRelations[];
};