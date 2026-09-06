# SMIT_Hackathon_Project

PROJECT tech stack:
* Next.js (TypeScript ke sath) – Main website framework.
* Tailwind CSS + Radix UI – Design, layout aur pre-built UI components (dialogs, dropdowns, buttons).
* Redux Toolkit – App ka data aur state handle karne ke liye.
* React Hook Form – Forms aur validation ke liye.
* Sonner – Pop-up alerts aur notifications (toasts) ke liye.
* Lucide React – Icons ke liye.


Working:


Bilkul. Tumhari Workspace Manager website ko simple way mein aise samjho:
1. Website open hoti hai
Website open
   ?
Login / Signup
User pehle login karta hai.


2. Login ke baad
Login
  ?
User ka role check
  ?
Owner / Admin / Member / Viewer
Har role ke different permissions hain.


3. Main website
Login ke baad main app open hoti hai:
Navbar
Sidebar
Main Content
Sidebar se user:
* Workspace select karta hai
* Project select karta hai
* Dashboard open karta hai
* Kanban open karta hai
* List open karta hai
* Calendar open karta hai
* 

4. Workspace
Workspace ke andar projects hote hain:
Workspace
   ?
Project
   ?
Tasks
Example:
SMIT Hackathon
   ??? Website Project
   ?     ??? Login Task
   ?     ??? Navbar Task
   ?     ??? Dashboard Task
   ?
   ??? Mobile Project
         ??? App Task


5. Task
Har task mein different information hoti hai:
Task
??? Title
??? Description
??? Status
??? Priority
??? Assignee
??? Due Date
??? Labels
??? Subtasks
??? Comments
??? Activity


6. Kanban Board
Tasks Kanban mein status ke according columns mein show hote hain:
Backlog ? Todo ? In Progress ? Done
Task ko drag karke doosre column mein le jao:
Todo
 ? drag
In Progress
To task ka status change ho jata hai.


7. List View
List View mein same tasks table ki form mein dikhte hain.
Task | Status | Priority | Assignee | Due Date
Yahan:
* Search
* Filter
* Sort
* Group
* Bulk actions
use kar sakte ho.


8. Calendar
Calendar mein tasks ki due dates show hoti hain.
Task ? Due Date ? Calendar
Agar task ki due date change karo, calendar bhi update hota hai.


9. Redux Toolkit
Redux Toolkit website ka temporary/current data manage karti hai.
Example:
Create Task
   ?
Redux
   ?
UI immediately update
Redux ko simple words mein website ki memory samjho.


10. localStorage
localStorage data ko browser mein save karta hai.
User creates Task
       ?
Redux update
       ?
localStorage save
Page refresh karne par:
localStorage
     ?
Redux
     ?
Website
Isliye data refresh ke baad bhi rehta hai.


11. CRUD
Website mein CRUD ka matlab:
C = Create
R = Read
U = Update
D = Delete
Example:
Create Task
     ?
Read Task
     ?
Edit Task
     ?
Delete Task
Ye changes Redux + localStorage ke through save hote hain.


12. Permissions
Role ke according actions allowed hain:
RoleAccessOwnerFull controlAdminManagement controlMemberTasks/collaborationViewerRead-onlyExample:
Viewer ? Delete Project ?
Member ? Change User Role ?
Admin ? Change Role ?
Owner ? Full Control ?


13. Dashboard
Owner/Admin ke Dashboard mein:
Workspaces
Projects
Tasks
Team Members
Statistics
Activity
Owner/Admin yahan se projects/workspaces edit/delete aur users ke roles manage kar sakte hain.


14. Notifications
Jab important action hota hai:
Task Created
Project Updated
Member Invited
Role Changed
       ?
Notification
       ?
Navbar notification icon
Notifications bhi localStorage mein save hoti hain.

15. Overall website ka complete flow
Sabse simple diagram:
             LOGIN
               ?
             ROLE
               ?
          ???????????
          ?         ?
     Dashboard    Workspace
                    ?
                 Project
                    ?
                  Task
               ?    ?    ?
          Kanban   List   Calendar
                    ?
                 Redux
                    ?
               localStorage
Short mein:
Tumhari website mein React UI banata hai, Redux Toolkit current data manage karti hai, localStorage data permanently browser mein save karta hai, aur permissions decide karti hain ke Owner/Admin/Member/Viewer kya kar sakta hai.

