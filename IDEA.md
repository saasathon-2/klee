## Idea discussion

User can send a prompt to an AI (we want to figure out a non-generic, non-textbox-ey way of doing this) which then builds them a web artefact. This is opened in a Notion-style popover window. The user can choose to fullscreen this window, share, close, or delete it with relevant icons in the header bar of the popover window. Artefacts are only accessible to the user until they click Share, after which they can share directly with a “Klee” user account or by copying a link, which allows it to be embedded in other pages such as Slack or GitHub.

The artefact itself tries to make itself as useful as possible to the user by fulfilling their prompt using template blocks that are hydrated with data, pulled in as context from the user’s prompt or connected apps such as Jira, Confluence, Google Drive, GitHub, etc. or supplied directly in the prompt/as attachments by the user. The application shouldn’t care where the data comes from; as long as it gets it, the template will be hydrated using it regardless (to the best of the LLM’s ability). The application has an intrinsic Dev-prod focus, connecting Git PRs, branches, repos, issues and changes with work items from tools such as Jira. It should also support other facets, but these will be less rich - still supported by the application, but the idea is that more templates and blocks are created for the developer field, meaning that the resultant artefacts will be more useful and contextual.

Another feature that will be supported is the artefact having suggested next steps where relevant, where a list of buttons is shown that can connect the work back to the connected apps, such as creating a pull request for the branch that you discussed the merge strategy for, creating a new Jira work item for the tasks that were suggested, etc. These should only show up for the user who created the artefact, not for viewing users.

Another feature, potentially locked to paid customers, is the ability to comment in specific areas of the document. This would allow other members of your team to say things they like about the artefact, request clarification or even request changes. The owner of the artefact would be able to respond in these comment threads, or even get AI to do it for them from the context that is stored within the artefact at the time it was created.

The user who created the artefact should also be able to follow up and request changes to it, as well as potentially being able to edit the text content manually to make minor tweaks.

Shared artefacts should be accessible, even when not signed in. Only signed-in users should be able to interact with the artefact (comment, etc.).

We also want a “Developer docs” section (docs.url.com?) that helps users set up the integrations with GitHub Actions, Slack bot, etc.

If you click "Share", it should make the artefact public once you send it to other peoples' emails or send the link to people. If you copy the link directly without clicking share (potentially?) then the user wont be able to access it but can request you share it with them directly through the app. "This artefact is private, request the owner to share it with you? [Request access]"

### Artefact setup

The way I imagine the artefacts and their generation is a collection of blocks. Each block can contain sub blocks - similar to how you would nest child components inside of a parent component in React. In this case, the parent component/block would be able to define the nesting container, which would determine how many child nodes it can contain, and if it can contain multiple how they should be displayed (grid, flex row/column, etc.). This is structured as a tree, where each leaf can contain multiple children inside of it and also have properties that link to elements inside of the component. For example a Task list block could have a title, sub title, preamble, and list of tasks that should be rendered richly (each task having collapsable extra information that the user can expand if they want to). Each of these would correspond to a specific data type and would be hydrated by the struct model (i.e. title is inferred from the tasks that it fetches or is generic like "Your tasks". preamble talks about tasks that youve already completed this sprint - if this info is available i.e. the info is pulled from jira, otherwise can be ignored/skipped. tasks are populated from jira/prompt and can be expanded by the LLM based on available info - again made easier if integrated with a tool). The flow is as follows:
User prompts for something -> AI interprets the prompt and converts it into the struct format (listed below in pseudo-code) -> AI finds the most relevant templates at each leaf (i.e. starts with the root/default style node, picks a relevant node for the next section, and for each node if there are available nesting children then it can pick the most relevant one. For example if a user asks for a breakdown of changes on their branch, it picks the root -> "developer" -> has a few options for "diff" views and picks relvant ones. if there's architectural changes then it can pick a diagram diff one, if theres code changes it can pick a code changes one, and if both are relevant it can pick both. This is because parent components can define the min/max number of nested children and how they should be displayed.) -> AI selects most relevant tree structure and parses it into the combined templated format (every node in the tree corresponds to a component/block file in say, the templates/ directory) -> AI returns the generated web artefact (essentially hydrated from the data in the data model, as I said the nodes in the tree correspond to components, so the generated artefact page is just grabbing components and populating the component fields/data wiht the linked relevant fields/data from the data model and then presenting hte result to the user) -> user can request follow up changes, manually edit some stuff, share, or delete the artefact. changes (both manual and via the chat window) will modify the underlying datamodel, and then the presented UI will be updated accordingly.

Another block I was considering is something I'm calling "Glue" - which connects/binds two somewhat unrelated blocks together. IT can just be a simple text label saying "and that means:" for example, or a downward arrow, anything that connects two concepts if they need it. This can be updated/populated based on context of the two blocks. It'd just be appended as a leaf node between the two blocks that need explaining. Not all blocks will need this, for example if they are simple enough to follow or are talking about pretty related things, but for something such as "Sprint Timeline Visual Bar" into "List of Rich Tasks" could say like "so here's what you should tackle next:".

For example "For my Jira project x, tell me about my upcoming tasks forthe remainder of the sprint." could spit out a developer template with blocks for the current sprint timeline (pulled from the active Jira sprint, if available and if there is such a sprint, otherwise ignored), glue, rich task list (again pulled from assigned jira tasks if available otherwise from the prompt. If not available at all it should just say the user), and then finally "Next steps"/"Recommended next steps" that has some options for say "Create a new branch for PROJ1/Task1", "Explore the system architecture for Task2 with a new artefact", "Clarify task details for Task1".

### Psuedocode

Each node represents a template/component/block in the app's templates/ directory. Each component file has properties on it that include whether it can nest children, min/max children it can nest, and any data fields that the AI can hydrate. Then, when the data model is generated, the properties on the struct will correspond 1:1 with properties in the template. It should support lists of elements (for nesting multiple elements), properties that correspond to fields in the template, etc.

{
root: artefact_page_template {
nests: generic_page {
nests: developer {
nests: [
timeline_view_sprint
nests: glue { glue_name, glue_context } nests: task_list_view { data: [...] }
]
}
}
}
}

### Concrete data-model example

For a pull-request review, the AI returns data such as this. It does not return HTML; the renderer selects the component named by each `template` and gives it that node's `data` and `children`.

```json
{
  "version": 1,
  "root": {
    "id": "root",
    "template": "artefact-page",
    "data": { "title": "PR #42 review" },
    "children": [
      {
        "id": "category",
        "template": "developer-page",
        "data": {
          "eyebrow": "Pull request review",
          "title": "Add GitHub artefact refresh",
          "summary": "The change refreshes the shared artefact after each PR update.",
          "tags": ["GitHub", "Backend"]
        },
        "children": [
          {
            "id": "checks",
            "template": "check-list",
            "data": {
              "title": "Checks",
              "checks": [
                { "name": "Backend tests", "status": "passed", "detail": "17 tests passed" },
                { "name": "Frontend build", "status": "pending", "detail": "Waiting for CI" }
              ]
            }
          },
          {
            "id": "next",
            "template": "next-steps",
            "data": {
              "title": "Next steps",
              "actions": [
                { "label": "Review workflow", "description": "Confirm PR updates trigger a refresh.", "action": "open-workflow" }
              ]
            }
          }
        ]
      }
    ]
  }
}
```

History is versioned data, not rendered pages. Version 1 stores this document; later versions store JSON-style patch operations, for example `{ "op": "replace", "path": ["root", "children", 0, "children", 0, "data", "checks", 1, "status"], "value": "passed" }`. To show any version, the app rebuilds its document by replaying patches, then renders that document through the same templates. No HTML snapshot is stored for a version.

## Visual design

The app currently uses HeroUI for its interface. Some visual inspirations include the Dia browser, early Spotify Wrapped (bold neon colours and black shapes), etc.
