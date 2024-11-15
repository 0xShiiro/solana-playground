import {
  Disposable,
  PgExplorer,
  PgRouter,
  PgTutorial,
  PgView,
} from "../utils/pg";

export const tutorial = PgRouter.create({
  path: "/tutorials/{tutorialName}",
  handle: ({ tutorialName }) => {
    // Get the tutorial
    const tutorial = PgTutorial.getTutorialData(tutorialName);

    // Check whether the tutorial exists
    if (!tutorial) {
      PgRouter.navigate();
      return;
    }

    let tutorialInit: Disposable | undefined;
    // Set main view
    PgView.setMainPrimary(async () => {
      // Initialize explorer
      await PgExplorer.init({ name: tutorial.name });

      // Set the current tutorial data, has to happen before tutorial init
      PgTutorial.data = tutorial;

      // Initialize tutorial
      tutorialInit = await PgTutorial.init();

      if (PgTutorial.isStarted(tutorial.name)) {
        PgTutorial.view = "main";
        PgView.setSidebarPage();
      } else {
        PgTutorial.view = "about";
        PgView.setSidebarPage("Tutorials");
      }

      const { default: Tutorial } = await tutorial.elementImport();
      return <Tutorial {...tutorial} />;
    });

    // Handle sidebar
    const sidebarPage = PgView.onDidChangeSidebarPage((state) => {
      if (state === "Tutorials") {
        PgTutorial.update({ view: "about" });
      } else {
        // Get whether the tutorial has started
        const started = PgTutorial.isStarted(tutorial.name);
        if (started) PgTutorial.update({ view: "main" });
        else PgRouter.navigate();
      }
    });

    // Minimize secondary main view and reopen on navigation to other routes
    let mainSecondaryHeight = 0;
    PgView.setMainSecondaryHeight((h) => {
      mainSecondaryHeight = h;
      return 0;
    });

    // Handle workspace switch
    const switchWorkspace = PgExplorer.onDidSwitchWorkspace(async () => {
      const name = PgExplorer.currentWorkspaceName;
      if (!name) return;

      if (PgTutorial.isWorkspaceTutorial(name)) await PgTutorial.open(name);
      else PgRouter.navigate();
    });

    return {
      dispose: () => {
        tutorialInit?.dispose();
        sidebarPage.dispose();

        // Set the main secondary view height to the previous saved value
        PgView.setMainSecondaryHeight(mainSecondaryHeight);

        switchWorkspace.dispose();
      },
    };
  },
});
