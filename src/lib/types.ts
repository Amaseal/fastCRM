import type {
    Task,
    Client, 
    User,
    Tab,
    Product, 
    Material, 
    File,
    TaskProduct 
} from '$lib/server/db/schema';

export type TaskWithRelations = Task & {
    client?: Client;
    manager?: User;
    responsiblePerson?: User;
    materials?: { material: Material }[]; // Use the junction table relationship
    taskProducts?: (TaskProduct & { product: Product })[]; // Include TaskProduct data with product
    files?: File[]; // Add files relation
};

export type TabWithRelations = Tab & {

};

export type TabWithTasks = TabWithRelations & {
	tasks: TaskWithRelations[];
};