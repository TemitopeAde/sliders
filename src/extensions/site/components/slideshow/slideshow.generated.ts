/**
 * THIS FILE IS AUTO-GENERATED — DO NOT EDIT.
 * It contains the `editorElement` portion of the manifest, automatically derived from your component's
 * source code, prop types, and CSS rules.
 * Update your source code and run `npx wix build && npx wix generate manifest` to regenerate it.
 * If you need to override specific manifest values (sizing, layout, etc.),
 * you can do so in slideshow.extension.ts.
 */

import type { EditorElement } from '@wix/react-component-schema';

export const editorElement = {
  "selector": ".slideshow",
  "displayName": "Slideshow",
  "data": {
    "direction": {
      "displayName": "Direction",
      "dataType": "direction"
    },
    "a11y": {
      "displayName": "Accessibility",
      "dataType": "a11y",
      "a11y": {
        "attributes": [
          "ariaLabel"
        ]
      }
    },
    "slides": {
      "displayName": "Slides",
      "dataType": "arrayItems",
      "arrayItems": {
        "data": {
          "items": {
            "name": {
              "displayName": "Name",
              "dataType": "text",
              "text": {}
            },
            "image": {
              "displayName": "Image",
              "dataType": "image",
              "image": {
                "category": "IMAGE"
              }
            },
            "title": {
              "displayName": "Title",
              "dataType": "text",
              "text": {}
            },
            "description": {
              "displayName": "Description",
              "dataType": "text",
              "text": {}
            },
            "buttonLabel": {
              "displayName": "Button Label",
              "dataType": "text",
              "text": {}
            },
            "link": {
              "displayName": "Link",
              "dataType": "link",
              "link": {
                "linkTypes": [
                  "externalLink",
                  "anchorLink",
                  "emailLink",
                  "phoneLink",
                  "dynamicPageLink",
                  "pageLink",
                  "whatsAppLink",
                  "documentLink",
                  "popupLink",
                  "addressLink",
                  "edgeAnchorLinks",
                  "loginToWixLink"
                ]
              }
            }
          }
        }
      }
    },
    "activeItem": {
      "displayName": "Active Item",
      "dataType": "number",
      "number": {},
      "defaultValue": 0
    },
    "autoPlay": {
      "displayName": "Auto Play",
      "dataType": "booleanValue"
    },
    "intervalSeconds": {
      "displayName": "Interval Seconds",
      "dataType": "number",
      "number": {
        "min": "2",
        "max": "20"
      }
    },
    "loop": {
      "displayName": "Loop",
      "dataType": "booleanValue"
    },
    "pauseButtonVisibility": {
      "displayName": "Pause Button Visibility",
      "dataType": "textEnum",
      "textEnum": {
        "options": [
          {
            "value": "showOnHover",
            "displayName": "Show On Hover"
          },
          {
            "value": "showAlways",
            "displayName": "Show Always"
          }
        ]
      }
    },
    "dashboardSliderId": {
      "displayName": "Dashboard Slider Id",
      "dataType": "text",
      "text": {}
    }
  },
  "elements": {
    "slideshowTitle": {
      "elementType": "inlineElement",
      "inlineElement": {
        "selector": ".slideshow-title",
        "displayName": "Title",
        "behaviors": {
          "removable": true,
          "selectable": false
        },
        "cssProperties": {
          "font": {
            "defaultValue": "700 36px/1.15 'Helvetica Neue',Arial,sans-serif"
          },
          "lineHeight": {
            "defaultValue": "1.15"
          },
          "letterSpacing": {},
          "textDecorationLine": {},
          "textTransform": {},
          "textAlign": {
            "defaultValue": "start"
          },
          "textShadow": {},
          "color": {
            "defaultValue": "#ffffff"
          },
          "display": {
            "display": {
              "displayValues": [
                "none",
                "block"
              ]
            }
          }
        }
      }
    },
    "slideshowDescription": {
      "elementType": "inlineElement",
      "inlineElement": {
        "selector": ".slideshow-description",
        "displayName": "Description",
        "behaviors": {
          "removable": true,
          "selectable": false
        },
        "cssProperties": {
          "font": {
            "defaultValue": "17px/1.5 'Helvetica Neue',Arial,sans-serif"
          },
          "lineHeight": {
            "defaultValue": "1.5"
          },
          "letterSpacing": {},
          "textDecorationLine": {},
          "textTransform": {},
          "textAlign": {
            "defaultValue": "start"
          },
          "textShadow": {},
          "color": {
            "defaultValue": "#f1f1f1"
          },
          "display": {
            "display": {
              "displayValues": [
                "none",
                "block"
              ]
            }
          }
        }
      }
    },
    "slideshowButton": {
      "elementType": "inlineElement",
      "inlineElement": {
        "selector": ".slideshow-button",
        "displayName": "Button",
        "behaviors": {
          "removable": true,
          "selectable": false
        },
        "cssProperties": {
          "font": {
            "defaultValue": "600 15px 'Helvetica Neue',Arial,sans-serif"
          },
          "lineHeight": {},
          "letterSpacing": {},
          "textDecorationLine": {
            "defaultValue": "none"
          },
          "textTransform": {},
          "textAlign": {},
          "textShadow": {},
          "color": {
            "defaultValue": "#11201e"
          },
          "display": {
            "display": {
              "displayValues": [
                "none",
                "inlineFlex"
              ]
            }
          },
          "background": {
            "defaultValue": "#d9f2ec"
          },
          "borderTop": {},
          "borderBottom": {},
          "borderInlineStart": {},
          "borderInlineEnd": {},
          "paddingTop": {},
          "paddingBottom": {},
          "paddingInlineStart": {
            "defaultValue": "24px"
          },
          "paddingInlineEnd": {
            "defaultValue": "24px"
          },
          "borderStartStartRadius": {
            "defaultValue": "999px"
          },
          "borderStartEndRadius": {
            "defaultValue": "999px"
          },
          "borderEndStartRadius": {
            "defaultValue": "999px"
          },
          "borderEndEndRadius": {
            "defaultValue": "999px"
          },
          "boxShadow": {}
        },
        "states": {
          "hover": {
            "displayName": "Hover",
            "className": "slideshow-button--hover",
            "pseudoClass": "hover"
          }
        }
      }
    },
    "slideshowNavButton": {
      "elementType": "inlineElement",
      "inlineElement": {
        "selector": ".slideshow-nav-button",
        "displayName": "Nav Button",
        "behaviors": {
          "removable": true,
          "selectable": false
        },
        "cssProperties": {
          "font": {},
          "lineHeight": {},
          "letterSpacing": {},
          "textDecorationLine": {},
          "textTransform": {},
          "textAlign": {},
          "textShadow": {},
          "color": {
            "defaultValue": "#ffffff"
          },
          "background": {
            "defaultValue": "rgba(0,0,0,0.75)"
          },
          "borderTop": {
            "defaultValue": "none"
          },
          "borderBottom": {
            "defaultValue": "none"
          },
          "borderInlineStart": {
            "defaultValue": "none"
          },
          "borderInlineEnd": {
            "defaultValue": "none"
          },
          "paddingTop": {
            "defaultValue": "0"
          },
          "paddingBottom": {
            "defaultValue": "0"
          },
          "paddingInlineStart": {
            "defaultValue": "0"
          },
          "paddingInlineEnd": {
            "defaultValue": "0"
          },
          "borderStartStartRadius": {
            "defaultValue": "50%"
          },
          "borderStartEndRadius": {
            "defaultValue": "50%"
          },
          "borderEndStartRadius": {
            "defaultValue": "50%"
          },
          "borderEndEndRadius": {
            "defaultValue": "50%"
          },
          "boxShadow": {},
          "display": {
            "display": {
              "displayValues": [
                "none",
                "flex"
              ]
            }
          }
        },
        "states": {
          "hover": {
            "displayName": "Hover",
            "className": "slideshow-nav-button--hover",
            "pseudoClass": "hover"
          },
          "disabled": {
            "displayName": "Disabled",
            "className": "slideshow-nav-button--disabled",
            "pseudoClass": "disabled"
          }
        }
      }
    },
    "slideshowPlayButton": {
      "elementType": "inlineElement",
      "inlineElement": {
        "selector": ".slideshow-play-button",
        "displayName": "Play Button",
        "behaviors": {
          "removable": true,
          "selectable": false
        },
        "cssProperties": {
          "font": {},
          "lineHeight": {},
          "letterSpacing": {},
          "textDecorationLine": {},
          "textTransform": {},
          "textAlign": {},
          "textShadow": {},
          "color": {
            "defaultValue": "#ffffff"
          },
          "background": {
            "defaultValue": "rgba(0,0,0,0.75)"
          },
          "borderTop": {
            "defaultValue": "none"
          },
          "borderBottom": {
            "defaultValue": "none"
          },
          "borderInlineStart": {
            "defaultValue": "none"
          },
          "borderInlineEnd": {
            "defaultValue": "none"
          },
          "paddingTop": {
            "defaultValue": "0"
          },
          "paddingBottom": {
            "defaultValue": "0"
          },
          "paddingInlineStart": {
            "defaultValue": "0"
          },
          "paddingInlineEnd": {
            "defaultValue": "0"
          },
          "borderStartStartRadius": {
            "defaultValue": "50%"
          },
          "borderStartEndRadius": {
            "defaultValue": "50%"
          },
          "borderEndStartRadius": {
            "defaultValue": "50%"
          },
          "borderEndEndRadius": {
            "defaultValue": "50%"
          },
          "boxShadow": {},
          "display": {
            "display": {
              "displayValues": [
                "none",
                "flex"
              ]
            }
          }
        },
        "states": {
          "hover": {
            "displayName": "Hover",
            "className": "slideshow-play-button--hover",
            "pseudoClass": "hover"
          },
          "disabled": {
            "displayName": "Disabled",
            "className": "slideshow-play-button--disabled",
            "pseudoClass": "disabled"
          }
        }
      }
    },
    "slideshowDot": {
      "elementType": "inlineElement",
      "inlineElement": {
        "selector": ".slideshow-dot",
        "displayName": "Dot",
        "behaviors": {
          "removable": true,
          "selectable": false
        },
        "cssProperties": {
          "font": {},
          "lineHeight": {},
          "letterSpacing": {},
          "textDecorationLine": {},
          "textTransform": {},
          "textAlign": {},
          "textShadow": {},
          "color": {},
          "background": {
            "defaultValue": "rgba(255,255,255,0.55)"
          },
          "borderTop": {
            "defaultValue": "none"
          },
          "borderBottom": {
            "defaultValue": "none"
          },
          "borderInlineStart": {
            "defaultValue": "none"
          },
          "borderInlineEnd": {
            "defaultValue": "none"
          },
          "paddingTop": {
            "defaultValue": "7px"
          },
          "paddingBottom": {
            "defaultValue": "7px"
          },
          "paddingInlineStart": {
            "defaultValue": "7px"
          },
          "paddingInlineEnd": {
            "defaultValue": "7px"
          },
          "borderStartStartRadius": {
            "defaultValue": "50%"
          },
          "borderStartEndRadius": {
            "defaultValue": "50%"
          },
          "borderEndStartRadius": {
            "defaultValue": "50%"
          },
          "borderEndEndRadius": {
            "defaultValue": "50%"
          },
          "boxShadow": {},
          "display": {
            "display": {
              "displayValues": [
                "none",
                "inlineBlock"
              ]
            }
          }
        },
        "states": {
          "active": {
            "displayName": "Active",
            "className": "slideshow-dot--active"
          },
          "hover": {
            "displayName": "Hover",
            "className": "slideshow-dot--hover",
            "pseudoClass": "hover"
          },
          "disabled": {
            "displayName": "Disabled",
            "className": "slideshow-dot--disabled",
            "pseudoClass": "disabled"
          }
        }
      }
    }
  },
  "cssProperties": {
    "background": {
      "defaultValue": "#11201e"
    },
    "borderTop": {},
    "borderBottom": {},
    "borderInlineStart": {},
    "borderInlineEnd": {},
    "paddingTop": {},
    "paddingBottom": {},
    "paddingInlineStart": {},
    "paddingInlineEnd": {},
    "borderStartStartRadius": {
      "defaultValue": "12px"
    },
    "borderStartEndRadius": {
      "defaultValue": "12px"
    },
    "borderEndStartRadius": {
      "defaultValue": "12px"
    },
    "borderEndEndRadius": {
      "defaultValue": "12px"
    },
    "boxShadow": {}
  },
  "cssCustomProperties": {},
  "displayGroups": {
    "slides": {
      "displayName": "Slide",
      "groupType": "arrayItems",
      "arrayItems": {
        "arrayItems": "slides",
        "selectedItemIndex": "activeItem"
      }
    }
  },
  "displayFilters": {
    "data": {
      "hide": [
        "activeItem"
      ]
    }
  }
} as EditorElement;
