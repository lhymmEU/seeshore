export interface Store {
    id: string, // Unique identifier for a store
    banner: string, // The url to the banner photo
    owners: User[],
    assistants: User[],
    members: string[], // This is the ids of the members
    name: string,
    description: string,
    rules: string,
    roles: Role[],
    tasks: string[],
    books: string[], // The ids of the books
    events: string[], // The ids of the events
    balance: number, // The remaining balance of the store
    spendings: string[], // The ids of the spendings
}

export interface User {
    id: string, // Unique identifier for a user
    name: string,
    avatar: string, // The url to the avatar picture
    type: "Guest" | "Member" | "Owner" | "Assistant",
    location?: string,
    favoriteBooks?: string[], // The ids of the books
    attendedEvents?: string[], // The ids of the events
    hostedEvents?: string[], // The ids of the events
    borrowed: string[], // The ids of the books
}

export interface Book {
    id: string, // Unique identifier for a book (UUID)
    isbn?: string, // ISBN of the book (optional)
    cover: string, // The url to the cover picture
    background: string, // The url to the background picture
    title: string,
    author: string,
    publicationDate: string,
    description: string,
    categories: string[],
    likes: number, // How many people have favorited this book
    borrowedDate?: string, // When the book was borrowed (optional)
    status: "available" | "borrowed", // Current status of the book
    link?: string, // Optional external link (e.g., to purchase or more info)
    location: string, // Physical location of the book in the store
    borrower?: string, // The id of the user who borrowed the book (optional)
}

export interface Spending {
    id: string,
    name: string,
    categories: string,
    time: string,
    amount: number,
    description: string
}

export interface Role {
    id: string, // Unique identifier for a role
    name: string,
    status: "created" | "assigned"
    assignee: string, // The id of the user
}

export interface Task {
    id: string,
    name: string,
    description: string,
    deadline: string,
    status: "created" | "assigned" | "finished"
    assignee?: string, // The id of the user
}

export interface StoreEvent {
    id: string,
    cover: string, // The url to the cover picture
    title: string,
    startDate: string,
    endDate: string,
    status: "proposed" | "open" | "full" | "cancelled" | "rejected" | "finished"
    description: string,
    location: string,
    attendees: string[], // The ids of the users
    hosts: string[], // The ids of the users
}